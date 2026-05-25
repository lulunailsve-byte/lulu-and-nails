import { NextRequest, NextResponse } from "next/server";
import {
  findConflictingBooking,
  getCalendarClient,
  getCalendarId,
} from "@/lib/google-calendar";
import { validateBookingForm } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type BookBody = {
  date?: string;            // YYYY-MM-DD
  tiempo?: number;          // minutos desde medianoche
  duracion?: number;        // minutos
  nombre?: string;
  apellido?: string;
  servicio?: string;
  telefono?: string;
  correo?: string;
  // Honeypot: campo oculto que solo bots completan
  website?: string;
  // Token de Cloudflare Turnstile (anti-bot)
  turnstileToken?: string;
};

type TurnstileVerifyResp = {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
};

// Verifica un token de Cloudflare Turnstile contra el endpoint de siteverify.
// Si TURNSTILE_SECRET_KEY no está seteado (entorno dev sin Turnstile), permite el paso
// y solo loguea un warning. En producción debe estar siempre seteado.
async function verifyTurnstile(token: string, remoteip?: string): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY no está seteado — saltando verificación. NO HACER EN PROD.");
    return { ok: true };
  }
  if (!token) {
    return { ok: false, reason: "missing-input-response" };
  }
  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (remoteip) form.append("remoteip", remoteip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = (await res.json()) as TurnstileVerifyResp;
    if (data.success) return { ok: true };
    return { ok: false, reason: (data["error-codes"] ?? []).join(",") || "verify-failed" };
  } catch (err) {
    console.error("turnstile verify error:", err);
    return { ok: false, reason: "verify-error" };
  }
}

// Mapea los códigos de error de Cloudflare Turnstile a mensajes amigables en español.
// Refs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#error-codes
function turnstileFriendly(reason?: string): {
  mensaje: string;
  cooldownSeconds: number;  // sugerencia al cliente: cuánto esperar antes de reintentar
} {
  const codes = (reason ?? "").split(",").map((c) => c.trim()).filter(Boolean);

  // "Hey, relax" — el caso clásico: token reutilizado, expirado o muchos intentos seguidos.
  if (
    codes.includes("timeout-or-duplicate") ||
    codes.includes("rate-limit")
  ) {
    return {
      mensaje:
        "¡Tranquilo! 💜 Has hecho muchos intentos seguidos. Espera un momento y vuelve a intentar.",
      cooldownSeconds: 60,
    };
  }
  if (codes.includes("missing-input-response")) {
    return {
      mensaje:
        "Falta completar la verificación anti-bot. Espera a que termine y vuelve a darle clic.",
      cooldownSeconds: 5,
    };
  }
  if (codes.includes("invalid-input-response")) {
    return {
      mensaje:
        "La verificación expiró o no es válida. Refresca la página y vuelve a empezar.",
      cooldownSeconds: 10,
    };
  }
  if (codes.includes("internal-error") || codes.includes("verify-error")) {
    return {
      mensaje:
        "Cloudflare está teniendo un problema. Intenta de nuevo en un minuto.",
      cooldownSeconds: 60,
    };
  }
  // Default: catch-all amigable
  return {
    mensaje:
      "No pudimos confirmar que eres humano. Refresca la página e intenta otra vez.",
    cooldownSeconds: 30,
  };
}

// Formato amigable de fecha en es-VE para mensajes al cliente.
function fmtFechaEs(d: Date): string {
  return d.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Caracas",
  });
}

// POST /api/book — crea evento en Google Calendar.
// Validación:
//   - Honeypot
//   - Datos básicos (nombre, apellido, correo, teléfono VE, fecha, hora, duración)
//   - No doble booking del mismo cliente en ventana de 28 días
export async function POST(req: NextRequest) {
  let body: BookBody;
  try {
    body = (await req.json()) as BookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  // 1. Honeypot: si el campo "website" viene completo, es un bot.
  // Devolvemos OK 200 para no darle pistas pero NO creamos el evento.
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true, mensaje: "ok" });
  }

  // 2. Cloudflare Turnstile: verifica que el request venga de un humano real.
  // El header X-Forwarded-For lo pone Vercel con la IP del cliente.
  const remoteip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const turnstile = await verifyTurnstile(body.turnstileToken ?? "", remoteip);
  if (!turnstile.ok) {
    const friendly = turnstileFriendly(turnstile.reason);
    return NextResponse.json(
      {
        ok: false,
        error: friendly.mensaje,
        codigo: "TURNSTILE_FAILED",
        cooldownSeconds: friendly.cooldownSeconds,
        reason: turnstile.reason,
      },
      { status: 429 },  // 429 Too Many Requests — semántica correcta para rate
    );
  }

  const {
    date,
    tiempo,
    duracion,
    servicio = "",
  } = body || {};

  // 3. Validar campos del cliente
  const formValidation = validateBookingForm({
    nombre: body.nombre ?? "",
    apellido: body.apellido ?? "",
    telefono: body.telefono ?? "",
    correo: body.correo ?? "",
  });
  if (!formValidation.ok) {
    return NextResponse.json(
      { ok: false, error: formValidation.mensaje, campo: formValidation.campo },
      { status: 400 },
    );
  }
  const { nombre, apellido, correo, telefonoNormalizado, telefonoOriginal, telefonoPais } =
    formValidation.clean;

  // 4. Validar fecha/tiempo/duración
  if (!date || tiempo === undefined || tiempo === null || !duracion) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos de la cita" },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { ok: false, error: "Formato de fecha inválido" },
      { status: 400 },
    );
  }
  const tiempoNum = Number(tiempo);
  const duracionNum = Number(duracion);
  if (!Number.isFinite(tiempoNum) || tiempoNum < 0 || tiempoNum > 24 * 60) {
    return NextResponse.json({ ok: false, error: "Hora inválida" }, { status: 400 });
  }
  if (!Number.isFinite(duracionNum) || duracionNum <= 0 || duracionNum > 8 * 60) {
    return NextResponse.json({ ok: false, error: "Duración inválida" }, { status: 400 });
  }

  // 5. Validar largo de servicio
  const servicioLimpio = String(servicio).trim().slice(0, 200);
  if (!servicioLimpio) {
    return NextResponse.json({ ok: false, error: "Falta el servicio" }, { status: 400 });
  }

  try {
    // 6. Chequear regla de 28 días entre citas del mismo cliente
    const conflict = await findConflictingBooking({
      correoLower: correo,
      telefonoNormalizado,
      requestedDateISO: date,
      windowDays: 28,
    });
    if (!conflict.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Ya tienes una cita el ${fmtFechaEs(conflict.conflictDate)}. ` +
            `Podrás reservar la próxima a partir del ${fmtFechaEs(conflict.canBookAfter)}. ` +
            `Si necesitas modificarla, contáctanos por WhatsApp.`,
          codigo: "DUPLICATE_BOOKING",
          conflictDate: conflict.conflictDate.toISOString(),
          canBookAfter: conflict.canBookAfter.toISOString(),
        },
        { status: 409 },
      );
    }

    // 7. Crear evento
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const hIni = Math.floor(tiempoNum / 60);
    const mIni = tiempoNum % 60;
    const total = tiempoNum + duracionNum;
    const hFin = Math.floor(total / 60);
    const mFin = total % 60;

    const startISO = `${date}T${pad(hIni)}:${pad(mIni)}:00`;
    const endISO = `${date}T${pad(hFin)}:${pad(mFin)}:00`;

    await calendar.events.insert({
      calendarId,
      sendUpdates: "all",
      requestBody: {
        summary: `${nombre} ${apellido} · ${servicioLimpio}`,
        description: [
          `Servicio: ${servicioLimpio}`,
          `Teléfono: ${telefonoOriginal} (${telefonoPais})`,
          `WhatsApp: https://wa.me/${telefonoNormalizado}`,
          `Correo: ${correo}`,
        ].join("\n"),
        start: { dateTime: startISO, timeZone: "America/Caracas" },
        end: { dateTime: endISO, timeZone: "America/Caracas" },
        attendees: [{ email: correo, displayName: `${nombre} ${apellido}`.trim() }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "email", minutes: 4 * 60 },
            { method: "email", minutes: 60 },
          ],
        },
      },
    });

    return NextResponse.json({ ok: true, mensaje: "Cita creada con éxito" });
  } catch (err) {
    console.error("book error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
