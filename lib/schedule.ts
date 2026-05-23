// Lógica de horarios de Lulu & Nails.
// Todos los minutos son "minutos desde medianoche, hora Caracas (UTC-4)".

// Bloques horarios
export const FIN_MANANA = 12 * 60;  // 12pm — fin del bloque de mañana
export const INI_TARDE  = 14 * 60;  // 2pm  — inicio del bloque de tarde
export const FIN_DIA    = 21 * 60;  // 9pm  — fin del día (última cita debe terminar aquí)
export const GAP        = 15;       // 15min de gap entre citas (calidad)

// Slots disponibles base: cada hora dentro de cada bloque.
// Mañana: 9, 10, 11am. Tarde/Noche: 2, 3, 4, 5, 6, 7, 8pm.
export const MORNING_SLOTS = [9 * 60, 10 * 60, 11 * 60];
export const EVENING_SLOTS = [14 * 60, 15 * 60, 16 * 60, 17 * 60, 18 * 60, 19 * 60, 20 * 60];
export const BASE_SLOTS = [...MORNING_SLOTS, ...EVENING_SLOTS];

export type BusyRange = { inicio: number; fin: number };

// ¿El slot cabe completo dentro de su bloque horario?
export function slotCabeEnBloque(start: number, duration: number): boolean {
  const end = start + duration;
  if (start < INI_TARDE) {
    return end <= FIN_MANANA;
  }
  return end <= FIN_DIA;
}

// ¿El slot choca con alguna cita existente (incluyendo gap post-cita)?
export function slotChoca(start: number, end: number, busy: BusyRange[]): boolean {
  return busy.some((b) => start < b.fin + GAP && end > b.inicio);
}

// Formato "9:00 AM" / "3:00 PM" desde minutos
export function minutosAStr(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const h12 = h % 12 || 12;
  const mm = min < 10 ? `0${min}` : `${min}`;
  return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

// Formato "09:00" / "15:00" (24h, para chips compactos)
export function minutosAStr24(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// "YYYY-MM-DD" sin depender del idioma del sistema
export function fechaStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ¿Domingo? (cerrado)
export function esDomingo(date: Date): boolean {
  return date.getDay() === 0;
}

// Calcula slots disponibles para un día dado, considerando duración total y ocupados.
export function calcularSlots(
  duracionTotal: number,
  ocupados: BusyRange[],
): Array<{ start: number; libre: boolean }> {
  const validos = BASE_SLOTS.filter((s) => slotCabeEnBloque(s, duracionTotal));
  return validos.map((start) => ({
    start,
    libre: !slotChoca(start, start + duracionTotal, ocupados),
  }));
}
