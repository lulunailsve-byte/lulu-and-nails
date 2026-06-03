import { NextRequest, NextResponse } from "next/server";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import { getCalendarClient, getCalendarId } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchLine(desc: string, prefix: string): string | null {
  for (const raw of desc.split("\n")) {
    const l = raw.trim();
    if (l.startsWith(prefix)) return l.slice(prefix.length).trim();
  }
  return null;
}

// GET /api/admin/citas — próximas reservas del calendario (45 días).
export async function GET(req: NextRequest) {
  let ok = false;
  try {
    ok = isValidSession(req.cookies.get(ADMIN_COOKIE)?.value);
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();
    const now = new Date();
    const max = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    const list = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: max.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const citas = (list.data.items ?? [])
      .filter((e) => e.start?.dateTime)
      .map((e) => {
        const desc = e.description ?? "";
        return {
          id: e.id ?? "",
          start: e.start!.dateTime as string,
          end: e.end?.dateTime ?? null,
          summary: e.summary ?? "",
          servicio: matchLine(desc, "Servicio:"),
          telefono: matchLine(desc, "Teléfono:"),
          whatsapp: desc.match(/wa\.me\/(\d+)/)?.[1] ?? null,
          correo: matchLine(desc, "Correo:"),
        };
      });

    return NextResponse.json({ ok: true, citas });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
