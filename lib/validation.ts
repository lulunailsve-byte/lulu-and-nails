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

// ─── Teléfonos: validación multi-país ─────────────────────────────
//
// Soportamos 7 países. Detección por prefijo internacional. Si el número
// viene sin prefijo, se asume Venezuela (es el mercado principal y el
// placeholder muestra formato local).
//
// Reglas por país (sin prefijo):
//   Venezuela 🇻🇪 (+58)  — 10 dígitos, operadores móviles 412/414/416/424/426
//   Argentina 🇦🇷 (+54)  — 10-11 dígitos (con o sin el 9 de móvil internacional)
//   Chile 🇨🇱     (+56)  — 9 dígitos, móviles empiezan con 9
//   Colombia 🇨🇴  (+57)  — 10 dígitos, móviles empiezan con 3
//   Italia 🇮🇹    (+39)  — 9-10 dígitos, móviles empiezan con 3
//   España 🇪🇸    (+34)  — 9 dígitos, móviles empiezan con 6 o 7
//   USA/Canadá 🇺🇸 (+1)  — 10 dígitos NANP (NPA y NXX no pueden empezar con 0/1)

type CountryPhoneConfig = {
  code: string;       // dial code sin "+"
  name: string;
  flag: string;
  example: string;    // ejemplo formateado, para el mensaje de error
  validate: (digitsAfterCode: string) => boolean;
};

const COUNTRY_PHONES: CountryPhoneConfig[] = [
  // Orden: códigos de varios dígitos primero para evitar matches falsos de "1"
  // antes de probar 58, 54, 56, etc.
  {
    code: "58",
    name: "Venezuela",
    flag: "🇻🇪",
    example: "+58 414 3441103",
    validate: (d) =>
      d.length === 10 && ["412", "414", "416", "424", "426"].includes(d.slice(0, 3)),
  },
  {
    code: "54",
    name: "Argentina",
    flag: "🇦🇷",
    example: "+54 9 11 1234 5678",
    validate: (d) => d.length >= 10 && d.length <= 11,
  },
  {
    code: "56",
    name: "Chile",
    flag: "🇨🇱",
    example: "+56 9 1234 5678",
    validate: (d) => d.length === 9 && d[0] === "9",
  },
  {
    code: "57",
    name: "Colombia",
    flag: "🇨🇴",
    example: "+57 300 1234567",
    validate: (d) => d.length === 10 && d[0] === "3",
  },
  {
    code: "39",
    name: "Italia",
    flag: "🇮🇹",
    example: "+39 333 1234567",
    validate: (d) => d.length >= 9 && d.length <= 10 && d[0] === "3",
  },
  {
    code: "34",
    name: "España",
    flag: "🇪🇸",
    example: "+34 612 345 678",
    validate: (d) => d.length === 9 && (d[0] === "6" || d[0] === "7"),
  },
  {
    code: "1",
    name: "USA/Canadá",
    flag: "🇺🇸",
    example: "+1 415 555 1234",
    validate: (d) =>
      d.length === 10 &&
      d[0] !== "0" && d[0] !== "1" &&
      d[3] !== "0" && d[3] !== "1",
  },
];

// Lista para usar en mensajes de error: "🇻🇪 Venezuela, 🇦🇷 Argentina, ..."
export const SUPPORTED_COUNTRIES_LABEL = COUNTRY_PHONES.map(
  (c) => `${c.flag} ${c.name}`,
).join(", ");

// Resultado: el número normalizado a SOLO dígitos con prefijo internacional
// (ej. "584143441103") y el país detectado.
export function normalizePhoneIntl(
  raw: string,
): { normalized: string; country: string } | null {
  if (!raw) return null;
  let digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  // Formato local venezolano "0414..." -> sacar el 0 inicial
  if (digits.startsWith("0")) digits = digits.slice(1);

  // Intentar matchear cada código de país por prefijo
  for (const c of COUNTRY_PHONES) {
    if (digits.startsWith(c.code)) {
      const rest = digits.slice(c.code.length);
      if (c.validate(rest)) {
        return { normalized: digits, country: c.name };
      }
    }
  }

  // Fallback: sin prefijo conocido → asumir Venezuela (formato local
  // sin código país, ej. "4143441103")
  const ve = COUNTRY_PHONES[0]!;
  if (ve.validate(digits)) {
    return { normalized: ve.code + digits, country: ve.name };
  }

  return null;
}

// Wrapper legacy — devuelve solo Venezuela. Mantener para no romper imports
// existentes, pero el código nuevo debe usar normalizePhoneIntl.
export function normalizePhoneVE(raw: string): string | null {
  const r = normalizePhoneIntl(raw);
  return r?.country === "Venezuela" ? r.normalized : null;
}

export function isValidPhoneIntl(s: string): boolean {
  return normalizePhoneIntl(s) !== null;
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
  | {
      ok: true;
      clean: {
        nombre: string;
        apellido: string;
        telefonoNormalizado: string;
        telefonoOriginal: string;
        telefonoPais: string;
        correo: string;
      };
    }
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
  const phoneResult = normalizePhoneIntl(telefonoOriginal);
  if (!phoneResult) {
    return {
      ok: false,
      campo: "telefono",
      mensaje:
        `WhatsApp inválido. Aceptamos: ${SUPPORTED_COUNTRIES_LABEL}. ` +
        `Si es de Venezuela usa 04XX XXXXXXX. Para otros países, incluye el código país (ej: +54, +1, +34).`,
    };
  }

  return {
    ok: true,
    clean: {
      nombre,
      apellido,
      correo,
      telefonoOriginal,
      telefonoNormalizado: phoneResult.normalized,
      telefonoPais: phoneResult.country,
    },
  };
}
