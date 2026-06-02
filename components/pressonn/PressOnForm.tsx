"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import {
  FORMAS,
  LARGOS,
  ACABADOS,
  MEDIDAS,
  type Option,
} from "@/lib/press-on";
import { waLink } from "@/lib/brand";
import { TurnstileWidget } from "@/components/booking/TurnstileWidget";

type Pic = { file: File; url: string };

// Comprime/redimensiona una imagen en el cliente a JPEG (máx 1600px lado mayor)
// para acelerar la subida y respetar el límite de 6MB del bucket. Si algo falla
// (formato no decodificable, etc.) devuelve el archivo original.
async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PressOnForm({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ref, setRef] = useState<Pic | null>(null);
  const [forma, setForma] = useState("");
  const [largo, setLargo] = useState("");
  const [acabado, setAcabado] = useState("");
  const [medidas, setMedidas] = useState<Record<string, Pic | null>>({});
  const [entrega, setEntrega] = useState("");
  const [agencia, setAgencia] = useState("");
  const [puntoCagua, setPuntoCagua] = useState("");
  const [paraCuando, setParaCuando] = useState("");
  const [notas, setNotas] = useState("");
  // Honeypot
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  // Tick del cooldown de Turnstile.
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => setCooldownLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  // Limpiar object URLs al desmontar.
  useEffect(() => {
    return () => {
      if (ref) URL.revokeObjectURL(ref.url);
      Object.values(medidas).forEach((p) => p && URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickReferencia(file: File) {
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setRef((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { file: compressed, url };
    });
  }

  async function pickMedida(key: string, file: File) {
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setMedidas((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.url);
      return { ...prev, [key]: { file: compressed, url } };
    });
  }

  const inCooldown = cooldownLeft > 0;

  async function submit() {
    if (!nombre.trim() || !whatsapp.trim()) return setErr("Completa tu nombre y WhatsApp.");
    if (!ref) return setErr("Sube una foto de referencia del diseño que quieres.");
    if (!forma || !largo || !acabado) return setErr("Escoge forma, largo y acabado.");
    if (!entrega) return setErr("Indica si eres de Cagua o necesitas envío.");
    if (entrega === "envio" && !agencia.trim()) return setErr("Indica la agencia de envío.");
    if (!turnstileToken) return setErr("Completa la verificación anti-bot.");
    if (inCooldown) return;

    setSubmitting(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.set("nombre", nombre);
      fd.set("whatsapp", whatsapp);
      fd.set("forma", forma);
      fd.set("largo", largo);
      fd.set("acabado", acabado);
      fd.set("entrega", entrega);
      fd.set("agencia", agencia);
      fd.set("puntoCagua", puntoCagua);
      fd.set("paraCuando", paraCuando);
      fd.set("notas", notas);
      fd.set("website", website);
      fd.set("turnstileToken", turnstileToken);
      fd.set("referencia", ref.file);
      for (const m of MEDIDAS) {
        const p = medidas[m.key];
        if (p) fd.set(`medida_${m.key}`, p.file);
      }

      const res = await fetch("/api/press-on", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data?.codigo === "TURNSTILE_FAILED") {
          setTurnstileToken("");
          if (typeof data.cooldownSeconds === "number") setCooldownLeft(data.cooldownSeconds);
        }
        throw new Error(data?.error ?? "No se pudo enviar la solicitud");
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/50 p-3 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-warm-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-br from-violet-500 to-pink-400 px-5 py-4 text-white">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.2em] opacity-90">Nuevo ✨</div>
            <h3 className="font-display text-lg font-semibold">Kit Press-On a tu medida</h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <SuccessView nombre={nombre} onClose={onClose} />
        ) : (
          <div className="overflow-y-auto px-5 py-5">
            <p className="text-sm leading-relaxed text-ink-500">
              Cuéntanos cómo las quieres y te preparamos un kit personalizado. Con esto
              armamos tu presupuesto y te escribimos por WhatsApp con los colores y el pago. 💜
            </p>

            {/* Datos */}
            <SectionTitle>Tus datos</SectionTitle>
            <div className="grid grid-cols-1 gap-3">
              <TextField label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Tu nombre y apellido" maxLength={80} disabled={submitting} autoComplete="name" />
              <TextField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="04XX XXXXXXX" type="tel" inputMode="tel" maxLength={20} disabled={submitting} autoComplete="tel" />
            </div>

            {/* Diseño */}
            <SectionTitle>Tu diseño</SectionTitle>
            <PhotoField
              label="Foto de referencia"
              required
              pic={ref}
              onPick={pickReferencia}
              hint="El diseño que quieres lograr"
              disabled={submitting}
            />
            <Field label="Forma de uña">
              <ChipRow options={FORMAS} value={forma} onChange={setForma} />
            </Field>
            <Field label="Largo">
              <ChipRow options={LARGOS} value={largo} onChange={setLargo} />
            </Field>
            <Field label="Acabado">
              <ChipRow options={ACABADOS} value={acabado} onChange={setAcabado} />
            </Field>

            {/* Medidas */}
            <SectionTitle>
              Medidas <span className="font-normal normal-case text-ink-400">(opcional)</span>
            </SectionTitle>
            <p className="-mt-1 mb-3 text-[11px] leading-relaxed text-ink-500">
              Para que el kit te calce perfecto. Toma las fotos con buena luz, dedos
              estirados y sin esmalte. También puedes enviarlas luego por WhatsApp.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MEDIDAS.map((m) => (
                <PhotoField
                  key={m.key}
                  label={m.label}
                  compact
                  pic={medidas[m.key] ?? null}
                  onPick={(f) => pickMedida(m.key, f)}
                  disabled={submitting}
                />
              ))}
            </div>

            {/* Entrega */}
            <SectionTitle>Entrega</SectionTitle>
            <div className="flex gap-2">
              <RadioCard label="Soy de Cagua" active={entrega === "cagua"} onClick={() => setEntrega("cagua")} />
              <RadioCard label="Necesito envío" active={entrega === "envio"} onClick={() => setEntrega("envio")} />
            </div>
            {entrega === "envio" && (
              <div className="mt-3">
                <TextField label="Agencia de envío" value={agencia} onChange={setAgencia} placeholder="Ej: Zoom, MRW, Tealca…" maxLength={120} disabled={submitting} />
                <p className="mt-1 text-[11px] text-amber-700">El costo de envío no está incluido.</p>
              </div>
            )}
            <div className="mt-3">
              <TextField
                label="¿Tienes a alguien en Cagua que pueda recibir? (opcional)"
                value={puntoCagua}
                onChange={setPuntoCagua}
                placeholder="Nombre de la persona o punto de encuentro"
                maxLength={120}
                disabled={submitting}
              />
            </div>

            {/* Fecha */}
            <SectionTitle>¿Para cuándo? <span className="font-normal normal-case text-ink-400">(opcional)</span></SectionTitle>
            <input
              type="date"
              value={paraCuando}
              onChange={(e) => setParaCuando(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50"
            />

            {/* Notas */}
            <SectionTitle>Notas <span className="font-normal normal-case text-ink-400">(opcional)</span></SectionTitle>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Colores que te gustan, detalles del diseño, etc."
              maxLength={400}
              rows={3}
              disabled={submitting}
              className="w-full resize-none rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50"
            />

            {/* Honeypot */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
              <label>
                Si ves este campo, déjalo vacío
                <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            <TurnstileWidget onToken={setTurnstileToken} />

            <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
              Te escribiremos por WhatsApp con el presupuesto a tasa BCV, los colores
              disponibles y los datos de pago para confirmar tu pedido.
            </p>

            {err && (
              <div className={"mt-3 rounded-xl border p-3 text-xs leading-relaxed " + (inCooldown ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-700")}>
                {err}
              </div>
            )}

            <button
              disabled={submitting || inCooldown}
              onClick={submit}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(123,92,255,.35)] disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : inCooldown ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Espera {cooldownLeft}s…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Enviar solicitud
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────

function SuccessView({ nombre, onClose }: { nombre: string; onClose: () => void }) {
  const waText = `Hola! Soy ${nombre || "una clienta"} 💜 Acabo de enviar mi solicitud de kit Press-On por la web.`;
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 text-3xl">
        💅
      </div>
      <h3 className="mt-5 font-script text-4xl text-violet-700">¡Solicitud enviada!</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
        Recibimos tu pedido{nombre ? `, ${nombre}` : ""}. Te escribiremos por WhatsApp con el
        presupuesto, los colores disponibles y los datos de pago. 💜
      </p>
      <a
        href={waLink(waText)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(37,211,102,.35)]"
      >
        <Sparkles className="h-4 w-4" />
        Escríbenos por WhatsApp
      </a>
      <button onClick={onClose} className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-violet-50 px-6 py-3 text-xs font-bold text-violet-700">
        Cerrar
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-[.12em] text-violet-500">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</span>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-violet-700">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50"
      />
    </label>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const sel = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={
              "rounded-full px-3.5 py-2 text-xs font-bold transition " +
              (sel ? "bg-ink-900 text-white shadow-[0_4px_14px_rgba(31,18,53,.2)]" : "bg-white text-ink-900 shadow-sm hover:bg-violet-50")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RadioCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-2xl border-2 px-3 py-3 text-center text-xs font-bold transition " +
        (active ? "border-violet-400 bg-violet-50 text-violet-700" : "border-transparent bg-white text-ink-900 shadow-sm hover:bg-violet-50")
      }
    >
      {label}
    </button>
  );
}

function PhotoField({
  label,
  pic,
  onPick,
  required,
  hint,
  compact,
  disabled,
}: {
  label: string;
  pic: Pic | null;
  onPick: (file: File) => void;
  required?: boolean;
  hint?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={
        "mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition " +
        (pic ? "border-violet-300 bg-violet-50/50" : "border-violet-200 bg-white hover:bg-violet-50/40") +
        (disabled ? " pointer-events-none opacity-50" : "")
      }
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-100 text-violet-500">
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pic.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={"block font-bold text-ink-900 " + (compact ? "text-[11px] leading-tight" : "text-sm")}>
          {label} {required && <span className="text-pink-500">*</span>}
        </span>
        <span className="block text-[11px] text-ink-500">
          {pic ? (
            <span className="inline-flex items-center gap-1 text-violet-600">
              <Check className="h-3 w-3" /> Foto lista · toca para cambiar
            </span>
          ) : (
            hint ?? "Toca para subir"
          )}
        </span>
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
