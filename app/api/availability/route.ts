import { NextRequest, NextResponse } from "next/server";
import { CARACAS_OFFSET, getCalendarClient, getCalendarId, toMinutosCaracas } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/availability?date=YYYY-MM-DD
// Devuelve { ocupados: [{ inicio, fin }], fecha }
// `inicio` y `fin` están en minutos desde medianoche, hora Caracas.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json(
      { error: "Falta el parámetro date (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: `${date}T00:00:00${CARACAS_OFFSET}`,
        timeMax: `${date}T23:59:59${CARACAS_OFFSET}`,
        timeZone: "America/Caracas",
        items: [{ id: calendarId }],
      },
    });

    const busy = fb.data.calendars?.[calendarId]?.busy ?? [];
    const ocupados = busy
      .filter((b) => b.start && b.end)
      .map((b) => ({
        inicio: toMinutosCaracas(b.start!),
        fin: toMinutosCaracas(b.end!),
      }));

    return NextResponse.json({ ocupados, fecha: date });
  } catch (err) {
    console.error("availability error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
