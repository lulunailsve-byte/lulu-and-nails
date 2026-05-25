// Plantillas y lógica de scheduling de recordatorios WhatsApp.

export type ReminderKind = "24h" | "2h";

// Formato de hora "h:MM AM/PM" en español-VE.
export function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Caracas",
  });
}

// Formato de fecha "jueves 28 de mayo" en español-VE.
export function formatFecha(date: Date): string {
  return date.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Caracas",
  });
}

export function message24h({
  nombre,
  fecha,
  hora,
  servicio,
}: {
  nombre: string;
  fecha: string;
  hora: string;
  servicio: string;
}): string {
  return (
    `Hola ${nombre}! 💜 Te recordamos tu cita en Lulu & Nails: *${fecha} a las ${hora}*.\n\n` +
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

// Decide qué recordatorios están pendientes para una cita dada, según la hora
// actual y los que ya fueron marcados como enviados.
//
// Política:
//   - "24h" → fires cuando minutesUntil ≤ 1440 (24h) AND > 120 (más de 2h).
//             El AND > 120 evita que dispare al mismo tiempo que "2h" para
//             reservas hechas con menos de 24h de anticipación.
//   - "2h"  → fires cuando minutesUntil ≤ 120 (2h) AND > 0.
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

  if (!sentSet.has("24h") && minutesUntil <= 1440 && minutesUntil > 120) {
    pending.push("24h");
  }
  if (!sentSet.has("2h") && minutesUntil <= 120) {
    pending.push("2h");
  }

  return pending;
}

// Codifica los kinds como string CSV para guardar en extendedProperties.
export function encodeSent(set: Set<ReminderKind>): string {
  return Array.from(set).sort().join(",");
}

export function decodeSent(str: string | undefined | null): Set<ReminderKind> {
  if (!str) return new Set();
  const valid: ReminderKind[] = ["24h", "2h"];
  const parts = str.split(",").map((s) => s.trim()) as ReminderKind[];
  return new Set(parts.filter((p) => valid.includes(p)));
}
