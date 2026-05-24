// Validaciones reutilizables (client y server).

// Regex de email pragmático (no RFC-perfect, pero suficiente para descartar basura).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.length >= 6 && trimmed.length <= 120 && EMAIL_RE.test(trimmed);
}

// Limites razonables para nombre/apellido.
export function isValidName(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.length >= 2 && trimmed.length <= 60 && /[A-Za-zÁ-ÿ]/.test(trimmed);
}

// Normaliza un teléfono venezolano a formato canónico solo dígitos con prefijo país.
// Ejemplos aceptados:
//   "+58 414-3441103"        -> "584143441103"
//   "0414 3441103"           -> "584143441103"
//   "414-3441103"            -> "584143441103"
//   "+584143441103"          -> "584143441103"
// Devuelve null si no parece un teléfono venezolano válido.
export function normalizePhoneVE(raw: string): string | null {
  if (!raw) return null;
  // Solo dígitos
  let digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  // Si empieza con 0 (formato local: 0414...), removerlo.
  if (digits.startsWith("0")) digits = digits.slice(1);

  // Si NO empieza con código país 58, agregarlo (asumimos VE).
  if (!digits.startsWith("58")) digits = "58" + digits;

  // Formato final esperado: 58 + 10 dígitos (operador 3 + número 7) = 12 dígitos
  if (digits.length !== 12) return null;

  // Operadores válidos VE: 412, 414, 416, 424, 426 (móviles)
  // o 212, 234, 235, 238, 239, 240, 241, 242, ..., 28x, 29x (fijos)
  // Para simplicidad solo validamos que sea móvil (es lo que pide WhatsApp).
  const operador = digits.slice(2, 5);
  const validOps = ["412", "414", "416", "424", "426"];
  if (!validOps.includes(operador)) return null;

  return digits;
}

export function isValidPhoneVE(s: string): boolean {
  return normalizePhoneVE(s) !== null;
}

// Trunca espacios duplicados / saltos de línea para campos libres.
export function sanitizeFreeText(s: string, max = 200): string {
  return s.replace(/\s+/g, " ").trim().slice(0, max);
}

// Resultado consolidado para usar en client y server.
export type BookingFormData = {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
};

export type ValidationResult =
  | { ok: true; clean: { nombre: string; apellido: string; telefonoNormalizado: string; telefonoOriginal: string; correo: string } }
  | { ok: false; campo: keyof BookingFormData; mensaje: string };

export function validateBookingForm(data: BookingFormData): ValidationResult {
  const nombre = sanitizeFreeText(data.nombre, 60);
  const apellido = sanitizeFreeText(data.apellido, 60);
  const correo = data.correo.trim().toLowerCase();
  const telefonoOriginal = data.telefono.trim();

  if (!isValidName(nombre)) {
    return { ok: false, campo: "nombre", mensaje: "Ingresa un nombre válido (mínimo 2 letras)" };
  }
  if (!isValidName(apellido)) {
    return { ok: false, campo: "apellido", mensaje: "Ingresa un apellido válido (mínimo 2 letras)" };
  }
  if (!isValidEmail(correo)) {
    return { ok: false, campo: "correo", mensaje: "Correo inválido. Ej: tu@correo.com" };
  }
  const telefonoNormalizado = normalizePhoneVE(telefonoOriginal);
  if (!telefonoNormalizado) {
    return {
      ok: false,
      campo: "telefono",
      mensaje: "WhatsApp inválido. Ej: +58 414-1234567 (operador 412/414/416/424/426)",
    };
  }

  return {
    ok: true,
    clean: { nombre, apellido, correo, telefonoOriginal, telefonoNormalizado },
  };
}
