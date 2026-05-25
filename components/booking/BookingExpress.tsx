"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, Check, Loader2, Sparkles, X } from "lucide-react";
import { SERVICES, PEDICURE, type Service } from "@/lib/services";
import {
  BASE_SLOTS,
  EVENING_SLOTS,
  MORNING_SLOTS,
  calcularSlots,
  esDomingo,
  fechaStr,
  minutosAStr,
  minutosAStr24,
  type BusyRange,
} from "@/lib/schedule";
import { BRAND, waLink } from "@/lib/brand";
import { validateBookingForm } from "@/lib/validation";
import { TurnstileWidget } from "./TurnstileWidget";

type Step = "form" | "contact" | "submitting" | "success" | "error";

const DOW_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

function next14Days(): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

export function BookingExpress() {
  const days = useMemo(next14Days, []);
  const [serviceId, setServiceId] = useState<string>(SERVICES[1]!.id); // semipermanente
  const [date, setDate] = useState<Date>(() => {
    const first = days.find((d) => !esDomingo(d));
    return first ?? days[0]!;
  });
  const [slot, setSlot] = useState<number | null>(null);
  const [pedi, setPedi] = useState(false);
  const [ocupados, setOcupados] = useState<BusyRange[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState<string>("");
  // Bumpear para forzar refetch de disponibilidad (ej. después de reservar)
  const [refreshTick, setRefreshTick] = useState(0);

  // Contact data
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  // Honeypot: campo oculto que solo bots completan
  const [website, setWebsite] = useState("");
  // Token de Cloudflare Turnstile (anti-bot). Lo seta el widget al completar el challenge.
  const [turnstileToken, setTurnstileToken] = useState("");
  // Cooldown en segundos cuando Turnstile pide esperar (rate-limit, token reutilizado, etc.).
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const service: Service = SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0]!;
  const totalDuration = service.duration + (pedi ? PEDICURE.duration : 0);
  const totalPrice = service.price + (pedi ? PEDICURE.price : 0);

  // Tick del cooldown — cuando es >0, baja 1 por segundo hasta llegar a 0.
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => {
      setCooldownLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  // Fetch availability when date changes o cuando se bumpea refreshTick
  // (ej. después de confirmar una reserva, para no mostrar el slot recién tomado como libre).
  // Se manda `cache: "no-store"` para evitar cache del navegador/CDN.
  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setSlot(null);
    fetch(`/api/availability?date=${fechaStr(date)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setOcupados(Array.isArray(data?.ocupados) ? data.ocupados : []);
      })
      .catch(() => {
        if (!cancelled) setOcupados([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, refreshTick]);

  const slotsInfo = useMemo(
    () => calcularSlots(totalDuration, ocupados),
    [totalDuration, ocupados],
  );
  const slotLookup = useMemo(
    () => new Map(slotsInfo.map((s) => [s.start, s.libre])),
    [slotsInfo],
  );

  function readyToContinue() {
    return serviceId && slot !== null && !esDomingo(date);
  }

  async function submitBooking() {
    // Validación client-side (mismos helpers que server). Evita roundtrip si está mal.
    const clientCheck = validateBookingForm({ nombre, apellido, telefono, correo });
    if (!clientCheck.ok) {
      setErrorMsg(clientCheck.mensaje);
      setStep("error");
      return;
    }
    if (!turnstileToken) {
      setErrorMsg("Por favor completa la verificación anti-bot.");
      setStep("error");
      return;
    }
    // Si estamos en cooldown, no permitir submit.
    if (cooldownLeft > 0) return;

    setStep("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: fechaStr(date),
          tiempo: slot,
          duracion: totalDuration,
          nombre,
          apellido,
          servicio: service.name + (pedi ? ` + ${PEDICURE.name}` : ""),
          telefono,
          correo,
          website, // honeypot — debe ir vacío
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Si el server rechaza el token (expirado, reutilizado, rate-limit),
        // limpiar el token (el widget va a refrescarse) y arrancar el cooldown
        // que el server sugiere — UI deshabilita el botón ese tiempo.
        if (data?.codigo === "TURNSTILE_FAILED") {
          setTurnstileToken("");
          if (typeof data.cooldownSeconds === "number") {
            setCooldownLeft(data.cooldownSeconds);
          }
        }
        throw new Error(data?.error ?? "No se pudo crear la cita");
      }
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setStep("error");
    }
  }

  if (step === "success") {
    return <SuccessView name={nombre} date={date} slot={slot!} service={service} pedi={pedi} reset={() => {
      setStep("form");
      setNombre("");
      setApellido("");
      setTelefono("");
      setCorreo("");
      setWebsite("");
      setTurnstileToken("");
      setSlot(null);
      // Forzar refetch — el ocupados está stale después de reservar
      setRefreshTick((t) => t + 1);
    }} />;
  }

  return (
    <section id="reservar" className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
          Reserva express
        </div>
        <h2 className="text-center font-display text-3xl font-semibold leading-tight text-ink-900">
          Agenda en <em className="font-normal italic text-violet-500">un minuto</em>
        </h2>
        <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />

        <div className="mt-8 space-y-7 rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_8px_28px_rgba(123,92,255,.08)]">
          {/* 1 · Servicio */}
          <div>
            <SectionLabel n={1} title="Servicio" />
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 no-scrollbar">
              {SERVICES.map((s) => {
                const isSel = s.id === serviceId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={
                      "flex min-w-[140px] flex-shrink-0 flex-col items-start gap-1.5 rounded-2xl p-3 text-left transition " +
                      (isSel
                        ? "bg-ink-900 text-white shadow-[0_8px_22px_rgba(31,18,53,.25)]"
                        : "bg-white text-ink-900 shadow-sm hover:bg-violet-50")
                    }
                  >
                    <span
                      className={
                        "overflow-hidden rounded-xl transition " +
                        (isSel ? "ring-2 ring-white/40" : "")
                      }
                    >
                      <Image
                        src={s.icon}
                        alt=""
                        width={206}
                        height={206}
                        className="h-10 w-10"
                      />
                    </span>
                    <span className="text-xs font-bold leading-tight">{s.name}</span>
                    <span className={"text-[10px] font-semibold " + (isSel ? "opacity-70" : "text-ink-500")}>
                      {s.duration}m · desde ${s.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 · Día */}
          <div>
            <SectionLabel n={2} title="Día" hint={mesActual(days)} />
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 no-scrollbar">
              {days.map((d) => {
                const closed = esDomingo(d);
                const isSel = sameDay(d, date);
                return (
                  <button
                    key={d.toISOString()}
                    disabled={closed}
                    onClick={() => !closed && setDate(d)}
                    className={
                      "flex min-w-[58px] flex-shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-2.5 transition " +
                      (closed
                        ? "bg-transparent text-ink-300"
                        : isSel
                          ? "bg-violet-500 text-white shadow-[0_4px_14px_rgba(123,92,255,.4)]"
                          : "bg-violet-50 text-ink-900 hover:bg-violet-100")
                    }
                  >
                    <span className={"text-[10px] font-semibold " + (isSel ? "opacity-85" : "opacity-60")}>
                      {DOW_SHORT[d.getDay()]}
                    </span>
                    <span className="font-display text-lg leading-none">{d.getDate()}</span>
                    {closed && <span className="text-[8px] uppercase tracking-wider">cerrado</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 · Hora */}
          <div>
            <SectionLabel n={3} title="Hora" hint="descanso 12–2pm" />
            {loadingSlots ? (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-violet-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Consultando disponibilidad…
              </div>
            ) : esDomingo(date) ? (
              <p className="mt-4 text-center text-sm text-ink-500">Cerrado los domingos.</p>
            ) : (
              <SlotsGrid
                slot={slot}
                onSelect={setSlot}
                slotLookup={slotLookup}
                duracionTotal={totalDuration}
              />
            )}
          </div>

          {/* 4 · Extras */}
          <div>
            <SectionLabel n={4} title="Extras" hint="opcional" />
            <button
              onClick={() => setPedi((v) => !v)}
              className={
                "mt-3 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition " +
                (pedi
                  ? "border-2 border-pink-400 bg-pink-50"
                  : "border-2 border-transparent bg-white shadow-sm hover:bg-pink-50/40")
              }
            >
              <span className="overflow-hidden rounded-xl">
                <Image
                  src={PEDICURE.icon}
                  alt=""
                  width={206}
                  height={206}
                  className="h-10 w-10"
                />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold">+ {PEDICURE.name}</div>
                <div className="text-[11px] text-ink-500">
                  +{PEDICURE.duration} min · +${PEDICURE.price}
                </div>
              </div>
              <div
                className={
                  "grid h-6 w-6 place-items-center rounded-md " +
                  (pedi ? "bg-pink-500" : "border-2 border-ink-300")
                }
              >
                {pedi && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="sticky bottom-3 z-30 mt-5">
          <div className="rounded-3xl border border-violet-100 bg-white/90 p-3 shadow-[0_-8px_24px_rgba(31,18,53,.06)] backdrop-blur">
            <div className="mb-2 flex items-center justify-between px-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Total estimado
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold">${totalPrice}</span>
                  <span className="text-[11px] text-ink-500">· {totalDuration} min</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Tu cita
                </div>
                <div className="text-xs font-bold">
                  {slot !== null
                    ? `${DOW_SHORT[date.getDay()]} ${date.getDate()} · ${minutosAStr24(slot)}`
                    : "Elige hora"}
                </div>
              </div>
            </div>
            <button
              disabled={!readyToContinue()}
              onClick={() => setStep("contact")}
              className="flex w-full items-center justify-between rounded-full bg-violet-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(123,92,255,.35)] transition disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Confirmar reserva
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {(step === "contact" || step === "submitting" || step === "error") && (
        <ContactSheet
          submitting={step === "submitting"}
          errorMsg={step === "error" ? errorMsg : ""}
          cooldownLeft={cooldownLeft}
          service={service}
          pedi={pedi}
          date={date}
          slot={slot!}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
          nombre={nombre}
          apellido={apellido}
          telefono={telefono}
          correo={correo}
          website={website}
          turnstileToken={turnstileToken}
          setNombre={setNombre}
          setApellido={setApellido}
          setTelefono={setTelefono}
          setCorreo={setCorreo}
          setWebsite={setWebsite}
          setTurnstileToken={setTurnstileToken}
          onClose={() => setStep("form")}
          onSubmit={submitBooking}
          onRetry={() => {
            setStep("contact");
            setErrorMsg("");
          }}
        />
      )}
    </section>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function SectionLabel({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[11px] font-bold uppercase tracking-[.06em] text-ink-400">
        {n} · {title}
      </span>
      {hint && <span className="text-[11px] font-semibold text-ink-400">{hint}</span>}
    </div>
  );
}

function SlotsGrid({
  slot,
  onSelect,
  slotLookup,
  duracionTotal,
}: {
  slot: number | null;
  onSelect: (m: number) => void;
  slotLookup: Map<number, boolean>;
  duracionTotal: number;
}) {
  const renderBlock = (label: string, slots: number[]) => {
    // Mostrar solo slots que existen en el lookup (es decir, que cabieron en su bloque)
    const visibles = slots.filter((s) => slotLookup.has(s));
    if (visibles.length === 0) return null;
    return (
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {visibles.map((m) => {
            const libre = slotLookup.get(m) ?? false;
            const isSel = slot === m;
            return (
              <button
                key={m}
                disabled={!libre}
                onClick={() => onSelect(m)}
                className={
                  "rounded-xl py-2.5 text-xs font-bold transition " +
                  (!libre
                    ? "bg-ink-900/5 text-ink-300 line-through"
                    : isSel
                      ? "bg-ink-900 text-white shadow-[0_4px_14px_rgba(31,18,53,.18)]"
                      : "bg-white text-ink-900 shadow-sm hover:bg-violet-50")
                }
              >
                {minutosAStr24(m)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const hayAlgo =
    BASE_SLOTS.some((s) => slotLookup.has(s) && slotLookup.get(s));

  return (
    <div className="mt-3 space-y-3">
      {renderBlock("☀️ Mañana", MORNING_SLOTS)}
      {renderBlock("🌙 Tarde", EVENING_SLOTS)}
      {!hayAlgo && (
        <p className="text-center text-sm text-ink-500">
          No hay horarios disponibles para {duracionTotal} min este día. Prueba otro.
        </p>
      )}
    </div>
  );
}

function ContactSheet(props: {
  submitting: boolean;
  errorMsg: string;
  cooldownLeft: number;
  service: Service;
  pedi: boolean;
  date: Date;
  slot: number;
  totalPrice: number;
  totalDuration: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  website: string;
  turnstileToken: string;
  setNombre: (v: string) => void;
  setApellido: (v: string) => void;
  setTelefono: (v: string) => void;
  setCorreo: (v: string) => void;
  setWebsite: (v: string) => void;
  setTurnstileToken: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onRetry: () => void;
}) {
  const dateStr = props.date.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const inCooldown = props.cooldownLeft > 0;
  const ok =
    props.nombre.trim() &&
    props.apellido.trim() &&
    props.telefono.trim() &&
    /\S+@\S+\.\S+/.test(props.correo) &&
    props.turnstileToken.length > 0 &&
    !inCooldown;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-y-auto rounded-3xl bg-warm-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-br from-violet-50 to-pink-50 px-5 py-4">
          <h3 className="font-display text-lg font-semibold">Tus datos</h3>
          <button
            onClick={props.onClose}
            disabled={props.submitting}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-ink-700 hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Resumen */}
          <div className="mb-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-4 text-sm">
            <Row label="💅 Servicio" value={props.service.name + (props.pedi ? ` + ${PEDICURE.name}` : "")} />
            <Row label="📅 Fecha" value={dateStr} />
            <Row label="🕐 Hora" value={minutosAStr(props.slot)} />
            <Row label="⏱ Duración" value={`${props.totalDuration} min`} />
            <div className="mt-2 flex items-baseline justify-between border-t border-violet-200/60 pt-2">
              <span className="text-xs font-bold text-ink-700">Total base</span>
              <span className="font-display text-xl font-semibold text-violet-700">
                ${props.totalPrice}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" value={props.nombre} onChange={props.setNombre} placeholder="Tu nombre" disabled={props.submitting} maxLength={60} autoComplete="given-name" />
              <Field label="Apellido" value={props.apellido} onChange={props.setApellido} placeholder="Tu apellido" disabled={props.submitting} maxLength={60} autoComplete="family-name" />
            </div>
            <Field label="WhatsApp" type="tel" value={props.telefono} onChange={props.setTelefono} placeholder="+58 4XX XXXXXXX" disabled={props.submitting} maxLength={20} autoComplete="tel" inputMode="tel" />
            <Field label="Correo" type="email" value={props.correo} onChange={props.setCorreo} placeholder="tu@correo.com" disabled={props.submitting} maxLength={120} autoComplete="email" inputMode="email" />
          </div>

          {/* Honeypot — campo invisible que solo bots completan. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
            <label>
              Si ves este campo, dejalo vacío
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={props.website}
                onChange={(e) => props.setWebsite(e.target.value)}
              />
            </label>
          </div>

          {/* Cloudflare Turnstile — anti-bot invisible (la mayoría de veces). */}
          <TurnstileWidget onToken={props.setTurnstileToken} />

          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
            📩 Recibirás recordatorios por correo: 1 día antes, 4h y 1h antes de tu cita.
            El precio final en bolívares y el detalle del diseño se confirman por WhatsApp.
          </p>

          {props.errorMsg && (
            <div
              className={
                "mt-3 rounded-xl border p-3 text-xs leading-relaxed " +
                (inCooldown
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-700")
              }
            >
              {props.errorMsg}
              {!inCooldown && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={props.onRetry}
                    className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={props.onClose}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
                  >
                    Cambiar fecha
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            disabled={!ok || props.submitting}
            onClick={props.onSubmit}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(123,92,255,.35)] disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
          >
            {props.submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : inCooldown ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Espera {props.cooldownLeft}s…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirmar reserva
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  maxLength,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "url" | "numeric";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-violet-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs text-ink-500">{label}</span>
      <span className="text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

function SuccessView({
  name,
  date,
  slot,
  service,
  pedi,
  reset,
}: {
  name: string;
  date: Date;
  slot: number;
  service: Service;
  pedi: boolean;
  reset: () => void;
}) {
  const dateStr = date.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = minutosAStr(slot);
  const srvName = service.name + (pedi ? ` + ${PEDICURE.name}` : "");
  const waText =
    `Hola Luizandra! Soy ${name}. Acabo de reservar una cita para el *${dateStr}* a las *${timeStr}*.\n\nServicio: *${srvName}*\n\nQuisiera consultarte el precio con mi diseño.`;

  return (
    <section id="reservar" className="bg-warm-white px-4 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-[0_8px_28px_rgba(123,92,255,.12)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 text-3xl">
          💜
        </div>
        <h3 className="mt-5 font-script text-4xl text-violet-700">¡Reservado!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          Tu cita para el {dateStr} a las {timeStr} fue registrada, {name}. Confirma por WhatsApp y te esperamos.
        </p>
        <a
          href={waLink(waText)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(37,211,102,.35)]"
        >
          <Sparkles className="h-4 w-4" />
          Confirmar por WhatsApp
        </a>
        <button
          onClick={reset}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-50 px-6 py-3 text-xs font-bold text-violet-700"
        >
          <Calendar className="h-4 w-4" />
          Reservar otra cita
        </button>
      </div>
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mesActual(days: Date[]): string {
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-VE", { month: "short" }).replace(".", "");
  const m1 = fmt(first);
  const m2 = fmt(last);
  return m1 === m2 ? cap(m1) : `${cap(m1)} – ${cap(m2)}`;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
