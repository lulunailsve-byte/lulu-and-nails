import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient, getCalendarId } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

type BookBody = {
  date: string;            // YYYY-MM-DD
  tiempo: number;          // minutos desde medianoche
  duracion: number;        // minutos
  nombre?: string;
  apellido?: string;
  servicio?: string;
  telefono?: string;
  correo?: string;
};

// POST /api/book — crea evento en Google Calendar.
export async function POST(req: NextRequest) {
  let body: BookBody;
  try {
    body = (await req.json()) as BookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const {
    date,
    tiempo,
    duracion,
    nombre = "",
    apellido = "",
    servicio = "",
    telefono = "",
    correo = "",
  } = body || {};

  if (!date || tiempo === undefined || !duracion) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos de la cita" },
      { status: 400 },
    );
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const tiempoNum = Number(tiempo);
    const duracionNum = Number(duracion);

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
        summary: `${nombre} ${apellido} · ${servicio}`.trim(),
        description: [
          `Servicio: ${servicio}`,
          `Teléfono: ${telefono}`,
          `Correo: ${correo}`,
        ].join("\n"),
        start: { dateTime: startISO, timeZone: "America/Caracas" },
        end: { dateTime: endISO, timeZone: "America/Caracas" },
        attendees: correo
          ? [{ email: correo, displayName: `${nombre} ${apellido}`.trim() }]
          : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },   // 1 día antes
            { method: "email", minutes: 4 * 60 },    // 4 horas antes
            { method: "email", minutes: 60 },        // 1 hora antes
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
