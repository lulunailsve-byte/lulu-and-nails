import { google } from "googleapis";

export function getCalendarClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Faltan variables de entorno de Google OAuth");
  }
  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: oauth2 });
}

export function getCalendarId(): string {
  const id = process.env.CALENDAR_ID;
  if (!id) throw new Error("Falta CALENDAR_ID");
  return id;
}

// Convierte un ISO datetime a minutos desde medianoche en Caracas (UTC-4).
export function toMinutosCaracas(iso: string): number {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const m = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  return h * 60 + m;
}

export const CARACAS_OFFSET = "-04:00";

// ─── Detección de doble booking ─────────────────────────────────────
//
// Busca eventos del mismo cliente (por correo Y por teléfono normalizado)
// en una ventana de ±28 días alrededor de la fecha solicitada.
// Si encuentra alguno, devuelve la fecha del conflicto más cercano y
// cuándo podría volver a reservar (28 días después de ese evento).
//
// Política: "no más de una cita cada 28 días por cliente".

export type ConflictCheckParams = {
  correoLower: string;       // email normalizado a lower
  telefonoNormalizado: string;  // ej. "584143441103"
  requestedDateISO: string;  // YYYY-MM-DD de la cita nueva
  windowDays?: number;       // default 28
};

export type ConflictResult =
  | { ok: true }
  | {
      ok: false;
      conflictDate: Date;       // fecha del evento conflictivo más cercano
      canBookAfter: Date;       // primera fecha en la que puede reservar (conflictDate + windowDays)
    };

export async function findConflictingBooking(
  params: ConflictCheckParams,
): Promise<ConflictResult> {
  const { correoLower, telefonoNormalizado, requestedDateISO, windowDays = 28 } = params;

  // Si por alguna razón no hay identificadores, no podemos chequear.
  if (!correoLower && !telefonoNormalizado) return { ok: true };

  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  // Ventana de búsqueda: requestedDate ± windowDays
  // Usamos hora Caracas (UTC-4) para ser consistentes.
  const reqDate = new Date(`${requestedDateISO}T12:00:00${CARACAS_OFFSET}`);
  const timeMin = new Date(reqDate.getTime() - windowDays * 86_400_000).toISOString();
  const timeMax = new Date(reqDate.getTime() + windowDays * 86_400_000).toISOString();

  // Buscamos por dos queries paralelas (email y teléfono) — Google `q` hace full-text
  // sobre summary/description/attendees, así que cualquiera de los dos debería matchear.
  const queries: string[] = [];
  if (correoLower) queries.push(correoLower);
  if (telefonoNormalizado) queries.push(telefonoNormalizado);
  // También buscamos por el teléfono sin código país, por si quedó así en eventos viejos.
  if (telefonoNormalizado && telefonoNormalizado.startsWith("58")) {
    queries.push(telefonoNormalizado.slice(2));
  }

  const resultsPerQuery = await Promise.all(
    queries.map((q) =>
      calendar.events.list({
        calendarId,
        q,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      }),
    ),
  );

  // Mergear todos los eventos únicos (por id) y verificar que realmente sean del cliente.
  const allEvents = new Map<string, NonNullable<NonNullable<typeof resultsPerQuery[number]["data"]["items"]>[number]>>();
  for (const r of resultsPerQuery) {
    for (const ev of r.data.items ?? []) {
      if (!ev.id) continue;
      allEvents.set(ev.id, ev);
    }
  }

  // Filtrar: solo eventos donde realmente aparezca el correo o el teléfono normalizado.
  // (Google `q` es fuzzy, podemos tener falsos positivos.)
  const matchedEvents = [...allEvents.values()].filter((ev) => {
    const haystack = [
      ev.description ?? "",
      ev.summary ?? "",
      ...(ev.attendees?.map((a) => a.email ?? "") ?? []),
    ]
      .join(" ")
      .toLowerCase();

    const correoMatch = correoLower && haystack.includes(correoLower);
    // Comparamos contra el teléfono normalizado y los dígitos del haystack también normalizados,
    // para detectar el número aunque haya separadores (414-344..., +58 414 344...).
    const digitsInHaystack = haystack.replace(/\D+/g, "");
    const phoneMatch =
      telefonoNormalizado &&
      (digitsInHaystack.includes(telefonoNormalizado) ||
        digitsInHaystack.includes(telefonoNormalizado.slice(2)));
    return Boolean(correoMatch || phoneMatch);
  });

  if (matchedEvents.length === 0) return { ok: true };

  // Encontrar el evento más cercano a la fecha solicitada.
  let closest = matchedEvents[0]!;
  let closestDelta = Infinity;
  for (const ev of matchedEvents) {
    const startIso = ev.start?.dateTime ?? ev.start?.date;
    if (!startIso) continue;
    const evDate = new Date(startIso);
    const delta = Math.abs(evDate.getTime() - reqDate.getTime());
    if (delta < closestDelta) {
      closestDelta = delta;
      closest = ev;
    }
  }

  const closestStartIso = closest.start?.dateTime ?? closest.start?.date;
  if (!closestStartIso) return { ok: true };
  const conflictDate = new Date(closestStartIso);
  const canBookAfter = new Date(conflictDate.getTime() + windowDays * 86_400_000);

  return { ok: false, conflictDate, canBookAfter };
}

