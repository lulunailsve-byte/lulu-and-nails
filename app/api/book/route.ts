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
};

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

  const {
    date,
    tiempo,
    duracion,
    servicio = "",
  } = body || {};

  // 2. Validar campos del cliente
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
  const { nombre, apellido, correo, telefonoNormalizado, telefonoOriginal } =
    formValidation.clean;

  // 3. Validar fecha/tiempo/duración
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

  // 4. Validar largo de servicio
  const servicioLimpio = String(servicio).trim().slice(0, 200);
  if (!servicioLimpio) {
    return NextResponse.json({ ok: false, error: "Falta el servicio" }, { status: 400 });
  }

  try {
    // 5. Chequear regla de 28 días entre citas del mismo cliente
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

    // 6. Crear evento
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
          `Teléfono: ${telefonoOriginal}`,
          `Teléfono (normalizado): ${telefonoNormalizado}`,
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
