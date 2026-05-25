import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient, getCalendarId } from "@/lib/google-calendar";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  decodeSent,
  encodeSent,
  formatHora,
  message2h,
  messageDia,
  pendingReminders,
  type ReminderKind,
} from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/cron/send-reminders
// Endpoint llamado por GitHub Actions cada 15 minutos.
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Lógica:
//   1. Lista eventos del Calendar entre ahora y +30h.
//   2. Para cada evento, parsea cliente (nombre, teléfono, servicio).
//   3. Calcula qué recordatorios están pendientes (no enviados, ventana correcta).
//   4. Envía vía Green API.
//   5. Marca como enviados en extendedProperties.private.remindersSent.
//
// Idempotente: si el cron corre 2 veces seguidas, el segundo no manda nada.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();
    const now = new Date();
    const timeMax = new Date(now.getTime() + 30 * 60 * 60 * 1000);

    const list = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const events = list.data.items ?? [];
    const log: Array<{
      eventId: string;
      kind?: ReminderKind;
      action: "sent" | "skipped" | "failed" | "no-phone";
      detail?: string;
    }> = [];

    for (const ev of events) {
      if (!ev.id || !ev.start?.dateTime) continue;

      const apptStart = new Date(ev.start.dateTime);
      const parsed = parseEventDescription(ev.description ?? "");
      const phone = parsed.telefonoNormalizado;

      if (!phone) {
        log.push({ eventId: ev.id, action: "no-phone" });
        continue;
      }

      const nombre = extractFirstName(ev.summary ?? "");
      const servicio = parsed.servicio ?? "tu cita";

      const sentSet = decodeSent(ev.extendedProperties?.private?.remindersSent);
      const pending = pendingReminders({ now, apptStart, sentSet });

      if (pending.length === 0) continue;

      const hora = formatHora(apptStart);
      const updatedSent = new Set(sentSet);

      for (const kind of pending) {
        const text =
          kind === "dia"
            ? messageDia({ nombre, hora, servicio })
            : message2h({ nombre, hora, servicio });

        const result = await sendWhatsAppMessage(phone, text);
        if (result.ok) {
          updatedSent.add(kind);
          log.push({ eventId: ev.id, kind, action: "sent", detail: result.idMessage });
        } else {
          log.push({ eventId: ev.id, kind, action: "failed", detail: result.error });
          // No marcamos como enviado, próximo cron reintenta.
        }
      }

      if (updatedSent.size !== sentSet.size) {
        await calendar.events.patch({
          calendarId,
          eventId: ev.id,
          requestBody: {
            extendedProperties: {
              private: { remindersSent: encodeSent(updatedSent) },
            },
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      scanned: events.length,
      log,
    });
  } catch (err) {
    console.error("cron send-reminders error:", err);
    const msg = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Parsea las líneas que /api/book escribe en description del evento.
// Orden importa: "Teléfono (normalizado):" antes que "Teléfono:" no aplica porque
// los prefijos no chocan (Teléfono: tiene ":" en posición 9, el otro tiene espacio).
function parseEventDescription(desc: string): {
  servicio?: string;
  telefonoOriginal?: string;
  telefonoNormalizado?: string;
  correo?: string;
} {
  const result: {
    servicio?: string;
    telefonoOriginal?: string;
    telefonoNormalizado?: string;
    correo?: string;
  } = {};
  for (const raw of desc.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("Servicio:")) {
      result.servicio = line.slice("Servicio:".length).trim();
    } else if (line.startsWith("Teléfono (normalizado):")) {
      result.telefonoNormalizado = line
        .slice("Teléfono (normalizado):".length)
        .trim();
    } else if (line.startsWith("Teléfono:")) {
      result.telefonoOriginal = line.slice("Teléfono:".length).trim();
    } else if (line.startsWith("Correo:")) {
      result.correo = line.slice("Correo:".length).trim();
    }
  }
  return result;
}

// Summary del evento: "Nombre Apellido · Servicio"
// Tomamos solo el primer nombre para que el saludo sea natural en el WhatsApp.
function extractFirstName(summary: string): string {
  const beforeDot = summary.split("·")[0]?.trim() ?? "";
  const first = beforeDot.split(/\s+/)[0];
  return first || "Cliente";
}
