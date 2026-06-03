"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import {
  FORMAS,
  LARGOS,
  ACABADOS,
  AGENCIAS,
  MEDIDAS,
  labelOf,
  type Option,
} from "@/lib/press-on";
import { waLink } from "@/lib/brand";
import { TurnstileWidget } from "@/components/booking/TurnstileWidget";

type Pic = { file: File; url: string };

// Galería de diseños que rota en el header del modal (slide automático).
// Las imágenes viven en public/press-on-gallery/. Si faltan, el header
// muestra el gradiente de fondo (degradación elegante).
const GALLERY = [
  "/press-on-gallery/1.jpeg",
  "/press-on-gallery/2.jpeg",
  "/press-on-gallery/3.jpeg",
  "/press-on-gallery/4.jpeg",
  "/press-on-gallery/5.jpeg",
  "/press-on-gallery/6.jpeg",
];

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
  const [direccionEnvio, setDireccionEnvio] = useState("");
  const [paraCuando, setParaCuando] = useState("");
  const [notas, setNotas] = useState("");
  // Honeypot
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  // Slide actual de la galería del header.
  const [slide, setSlide] = useState(0);

  // Tick del cooldown de Turnstile.
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => setCooldownLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  // Auto-avance de la galería del header cada 3s.
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % GALLERY.length), 3000);
    return () => clearInterval(id);
  }, []);

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
    if (!entrega) return setErr("Indica si es entrega personal o envío.");
    if (entrega === "envio" && !agencia) return setErr("Selecciona la agencia de envío.");
    if (entrega === "envio" && !direccionEnvio.trim()) return setErr("Indica la dirección de la agencia de envío.");
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
      fd.set("direccionEnvio", direccionEnvio);
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
        {/* Header con galería de diseños (slide automático) */}
        <div className="relative h-44 shrink-0 overflow-hidden bg-gradient-to-br from-violet-500 to-pink-400">
          {GALLERY.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className={
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 " +
                (i === slide ? "opacity-100" : "opacity-0")
              }
            />
          ))}
          {/* Oscurecido arriba para legibilidad del texto */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-900/55 to-transparent" />
          {/* Difuminado abajo hacia el formulario (como el header principal) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-warm-white via-warm-white/70 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between px-5 py-4">
            <div className="text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,.45)" }}>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] opacity-90">Nuevo ✨</div>
              <h3 className="font-display text-lg font-semibold">Kit Press-On a tu medida</h3>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              aria-label="Cerrar"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-900/40 text-white backdrop-blur transition hover:bg-ink-900/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Puntitos indicadores */}
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {GALLERY.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1.5 rounded-full bg-white shadow transition-all " +
                  (i === slide ? "w-4" : "w-1.5 opacity-60")
                }
              />
            ))}
          </div>
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
              <RadioCard label="Entrega personal (Cagua, Turmero)" active={entrega === "cagua"} onClick={() => setEntrega("cagua")} />
              <RadioCard label="Necesito envío" active={entrega === "envio"} onClick={() => setEntrega("envio")} />
            </div>
            {entrega === "envio" && (
              <div className="mt-3 space-y-3">
                <Field label="Agencia de envío">
                  <ChipRow options={AGENCIAS} value={agencia} onChange={setAgencia} />
                </Field>
                {agencia && (
                  <TextField
                    label={`Dirección de la agencia ${labelOf(AGENCIAS, agencia)}`}
                    value={direccionEnvio}
                    onChange={setDireccionEnvio}
                    placeholder="Ciudad, sucursal/oficina, punto de referencia…"
                    maxLength={200}
                    disabled={submitting}
                  />
                )}
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  📦 El envío es <strong>pago destino</strong> (lo pagas al recibir).
                </p>
              </div>
            )}

            {/* Fecha */}
            <SectionTitle>¿Para cuándo la necesitas?</SectionTitle>
            <p className="-mt-1 mb-2 text-[11px] leading-relaxed text-ink-500">
              ⏱ El tiempo de realización es de <strong>1 a 2 días</strong>.
            </p>
            {/* Wrapper con placeholder propio: los <input type=date> no muestran
                placeholder en móvil. Ocultamos el texto nativo cuando está vacío
                (text-transparent) y mostramos nuestro propio rótulo encima. */}
            <div className="relative">
              <input
                type="date"
                value={paraCuando}
                onChange={(e) => setParaCuando(e.target.value)}
                disabled={submitting}
                className={
                  "w-full rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50 " +
                  (paraCuando ? "" : "text-transparent")
                }
              />
              {!paraCuando && (
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-ink-400">
                  Selecciona una fecha
                </span>
              )}
            </div>

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
  const thumb = pic ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pic.url} alt="" className="h-full w-full object-cover" />
  ) : (
    <ImagePlus className="h-6 w-6" />
  );

  const status = pic ? (
    <span className="inline-flex items-center gap-1 text-violet-600">
      <Check className="h-3 w-3" /> Foto lista · cambiar
    </span>
  ) : (
    hint ?? "Toca para subir"
  );

  const fileInput = (
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
  );

  const wrap =
    "cursor-pointer rounded-2xl border-2 border-dashed transition " +
    (pic ? "border-violet-300 bg-violet-50/50" : "border-violet-200 bg-white hover:bg-violet-50/40") +
    (disabled ? " pointer-events-none opacity-50" : "");

  // Compacto (medidas): ícono ARRIBA y texto DEBAJO, centrado — así el texto
  // tiene todo el ancho de la tarjeta y no se ve cortado en móvil.
  if (compact) {
    return (
      <label className={wrap + " flex flex-col items-center gap-2 p-3 text-center"}>
        <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-violet-100 text-violet-500">
          {thumb}
        </span>
        <span>
          <span className="block text-[11px] font-bold leading-tight text-ink-900">
            {label} {required && <span className="text-pink-500">*</span>}
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight text-ink-500">{status}</span>
        </span>
        {fileInput}
      </label>
    );
  }

  // Normal (referencia): ícono a la izquierda, texto a la derecha.
  return (
    <label className={wrap + " mt-3 flex items-center gap-3 p-3"}>
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-100 text-violet-500">
        {thumb}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink-900">
          {label} {required && <span className="text-pink-500">*</span>}
        </span>
        <span className="block text-[11px] text-ink-500">{status}</span>
      </span>
      {fileInput}
    </label>
  );
}
