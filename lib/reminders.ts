// Plantillas y lógica de scheduling de recordatorios WhatsApp.

export type ReminderKind = "dia" | "2h";

// Formato de hora "h:MM AM/PM" en español-VE.
export function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Caracas",
  });
}

export function messageDia({
  nombre,
  hora,
  servicio,
}: {
  nombre: string;
  hora: string;
  servicio: string;
}): string {
  return (
    `Hola ${nombre}! 💜 Te recordamos tu cita en Lulu & Nails: *hoy a las ${hora}*.\n\n` +
    `Servicio: ${servicio}\n\n` +
    `¡Te esperamos!`
  );
}

export function message2h({
  nombre,
  hora,
  servicio,
}: {
  nombre: string;
  hora: string;
  servicio: string;
}): string {
  return (
    `Hola ${nombre}! Tu cita en Lulu & Nails es *en menos de 2 horas* (${hora}) 💅\n\n` +
    `Servicio: ${servicio}\n\n` +
    `¡Nos vemos pronto!`
  );
}

// Convierte un Date a un objeto plano con hora/día en zona Caracas.
// Sirve para chequear "estamos en el mismo día?" sin depender de la TZ del server.
export function caracasParts(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value]),
  );
  return {
    year: parseInt(parts.year!, 10),
    month: parseInt(parts.month!, 10),
    day: parseInt(parts.day!, 10),
    hour: parseInt(parts.hour!, 10),
    minute: parseInt(parts.minute!, 10),
  };
}

export function sameDayCaracas(a: Date, b: Date): boolean {
  const pa = caracasParts(a);
  const pb = caracasParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

// Decide qué recordatorios están pendientes para una cita dada, según la hora
// actual y los que ya fueron marcados como enviados.
//
// Política:
//   - "dia"  → fires cuando estamos en el mismo día Caracas, hora ≥ 9 y faltan
//             más de 150 min para la cita (>2.5h, evita choque con "2h").
//   - "2h"   → fires cuando minutesUntil ≤ 120 y > 0.
//   - Ambos: skip si ya fueron enviados (sentSet).
export function pendingReminders({
  now,
  apptStart,
  sentSet,
}: {
  now: Date;
  apptStart: Date;
  sentSet: Set<ReminderKind>;
}): ReminderKind[] {
  const minutesUntil = (apptStart.getTime() - now.getTime()) / 60_000;
  if (minutesUntil <= 0) return []; // cita ya pasó o está empezando

  const pending: ReminderKind[] = [];

  // "dia"
  if (!sentSet.has("dia")) {
    const sameDay = sameDayCaracas(now, apptStart);
    const nowHour = caracasParts(now).hour;
    if (sameDay && nowHour >= 9 && minutesUntil > 150) {
      pending.push("dia");
    }
  }

  // "2h"
  if (!sentSet.has("2h")) {
    if (minutesUntil <= 120) {
      pending.push("2h");
    }
  }

  return pending;
}

// Codifica los kinds como string CSV para guardar en extendedProperties.
export function encodeSent(set: Set<ReminderKind>): string {
  return Array.from(set).sort().join(",");
}

export function decodeSent(str: string | undefined | null): Set<ReminderKind> {
  if (!str) return new Set();
  const valid: ReminderKind[] = ["dia", "2h"];
  const parts = str.split(",").map((s) => s.trim()) as ReminderKind[];
  return new Set(parts.filter((p) => valid.includes(p)));
}
