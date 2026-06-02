import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile, turnstileFriendly } from "@/lib/turnstile";
import { getSupabaseAdmin, PRESS_ON_BUCKET } from "@/lib/supabase";
import {
  validatePressOn,
  labelOf,
  FORMAS,
  LARGOS,
  ACABADOS,
  MEDIDAS,
  type PressOnFields,
  type PressOnClean,
} from "@/lib/press-on";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Lee un campo de archivo del FormData. Devuelve el File solo si existe y tiene
// contenido (>0 bytes); si no, null.
function readFile(fd: FormData, name: string): File | null {
  const v = fd.get(name);
  if (v && typeof v !== "string" && typeof (v as File).arrayBuffer === "function") {
    const f = v as File;
    if (f.size > 0) return f;
  }
  return null;
}

function readText(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v : "";
}

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

// POST /api/press-on — recibe el formulario de kit Press-On (multipart),
// guarda las fotos en Supabase Storage, inserta la solicitud en la tabla
// press_on_requests y notifica a la dueña por WhatsApp.
export async function POST(req: NextRequest) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Formulario inválido" }, { status: 400 });
  }

  // 1. Honeypot: si "website" viene completo, es un bot. OK 200 sin guardar.
  if (readText(fd, "website").trim().length > 0) {
    return NextResponse.json({ ok: true, mensaje: "ok" });
  }

  // 2. Turnstile (anti-bot).
  const remoteip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const turnstile = await verifyTurnstile(readText(fd, "turnstileToken"), remoteip);
  if (!turnstile.ok) {
    const friendly = turnstileFriendly(turnstile.reason);
    return NextResponse.json(
      {
        ok: false,
        error: friendly.mensaje,
        codigo: "TURNSTILE_FAILED",
        cooldownSeconds: friendly.cooldownSeconds,
      },
      { status: 429 },
    );
  }

  // 3. Validar campos de texto.
  const fields: PressOnFields = {
    nombre: readText(fd, "nombre"),
    whatsapp: readText(fd, "whatsapp"),
    forma: readText(fd, "forma"),
    largo: readText(fd, "largo"),
    acabado: readText(fd, "acabado"),
    entrega: readText(fd, "entrega"),
    agencia: readText(fd, "agencia"),
    puntoCagua: readText(fd, "puntoCagua"),
    paraCuando: readText(fd, "paraCuando"),
    notas: readText(fd, "notas"),
  };
  const validation = validatePressOn(fields);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.mensaje, campo: validation.campo },
      { status: 400 },
    );
  }
  const c = validation.clean;

  // 4. Foto de referencia (obligatoria) + fotos de medidas (opcionales).
  const referencia = readFile(fd, "referencia");
  if (!referencia) {
    return NextResponse.json(
      { ok: false, error: "Sube una foto de referencia del diseño que quieres.", campo: "referencia" },
      { status: 400 },
    );
  }

  // Recolectar todos los archivos a subir con su columna destino.
  const uploads: { column: string; field: string; file: File }[] = [
    { column: "referencia_url", field: "referencia", file: referencia },
  ];
  for (const m of MEDIDAS) {
    const f = readFile(fd, `medida_${m.key}`);
    if (f) uploads.push({ column: `medida_${m.key}_url`, field: `medida_${m.key}`, file: f });
  }

  // Validar tipo/tamaño antes de subir nada.
  for (const u of uploads) {
    if (!ALLOWED_TYPES.includes(u.file.type)) {
      return NextResponse.json(
        { ok: false, error: "Formato de imagen no soportado. Usa JPG, PNG o WEBP." },
        { status: 400 },
      );
    }
    if (u.file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Una de las fotos supera 6 MB. Comprímela o toma otra." },
        { status: 400 },
      );
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const id = crypto.randomUUID();

    // 5. Subir fotos al bucket bajo la carpeta del id.
    const urls: Record<string, string> = {};
    for (const u of uploads) {
      const path = `${id}/${u.field}.${extFor(u.file.type)}`;
      const buf = await u.file.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from(PRESS_ON_BUCKET)
        .upload(path, buf, { contentType: u.file.type, upsert: true });
      if (upErr) throw new Error(`Storage upload (${u.field}): ${upErr.message}`);
      const { data: pub } = supabase.storage.from(PRESS_ON_BUCKET).getPublicUrl(path);
      urls[u.column] = pub.publicUrl;
    }

    // 6. Insertar la solicitud.
    const { error: insErr } = await supabase.from("press_on_requests").insert({
      id,
      nombre: c.nombre,
      whatsapp: c.whatsappNormalizado,
      whatsapp_original: c.whatsappOriginal,
      pais: c.pais,
      forma: c.forma,
      largo: c.largo,
      acabado: c.acabado,
      referencia_url: urls.referencia_url ?? null,
      notas: c.notas,
      medida_der_frente_url: urls.medida_der_frente_url ?? null,
      medida_der_perfil_url: urls.medida_der_perfil_url ?? null,
      medida_izq_frente_url: urls.medida_izq_frente_url ?? null,
      medida_izq_perfil_url: urls.medida_izq_perfil_url ?? null,
      entrega: c.entrega,
      agencia: c.agencia,
      punto_cagua: c.puntoCagua,
      para_cuando: c.paraCuando,
    });
    if (insErr) throw new Error(`DB insert: ${insErr.message}`);

    // 7. Notificar a la dueña por WhatsApp (best-effort, no bloquea el éxito).
    try {
      await sendWhatsAppMessage(BRAND.waNumber, buildOwnerMessage(c, urls));
    } catch (notifyErr) {
      console.error("press-on notify error:", notifyErr);
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("press-on error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Construye el mensaje de WhatsApp que recibe la dueña con el resumen + links.
function buildOwnerMessage(c: PressOnClean, urls: Record<string, string>): string {
  const entrega =
    c.entrega === "envio"
      ? `Envío (${c.agencia ?? "agencia por confirmar"}) — el envío no está incluido`
      : "Retira en Cagua";

  const lines: string[] = [
    "🆕 *Nueva solicitud Press-On*",
    "",
    `👤 ${c.nombre}`,
    `📱 https://wa.me/${c.whatsappNormalizado} (${c.pais})`,
    `💅 Forma: ${labelOf(FORMAS, c.forma)} · Largo: ${labelOf(LARGOS, c.largo)} · Acabado: ${labelOf(ACABADOS, c.acabado)}`,
    `📦 ${entrega}`,
  ];
  if (c.puntoCagua) lines.push(`📍 Punto en Cagua: ${c.puntoCagua}`);
  lines.push(`📅 Para: ${c.paraCuando ?? "sin fecha definida"}`);
  if (c.notas) lines.push(`📝 Notas: ${c.notas}`);

  lines.push("", `📸 Referencia: ${urls.referencia_url ?? "—"}`);

  const medidas = MEDIDAS.filter((m) => urls[`medida_${m.key}_url`]);
  if (medidas.length > 0) {
    lines.push(`✋ Medidas (${medidas.length}/4):`);
    for (const m of medidas) lines.push(`   • ${m.label}: ${urls[`medida_${m.key}_url`]}`);
  } else {
    lines.push("✋ Medidas: la clienta no las envió (pedirlas por WhatsApp).");
  }

  return lines.join("\n");
}
