// Catálogo de opciones + validación para las solicitudes de kits Press-On.
// Fuente única de verdad: el formulario (UI) y la API leen de aquí.

import { normalizePhoneIntl, isValidName, sanitizeFreeText } from "./validation";

export type Option = { id: string; label: string };

export const FORMAS: Option[] = [
  { id: "almendra", label: "Almendra" },
  { id: "stiletto", label: "Stiletto" },
  { id: "cuadrada", label: "Cuadrada" },
  { id: "squoval", label: "Squoval" },
  { id: "como_la_foto", label: "Como la foto" },
];

export const LARGOS: Option[] = [
  { id: "cortas", label: "Cortas" },
  { id: "medias", label: "Medias" },
  { id: "largas", label: "Largas" },
  { id: "como_la_foto_mas_corto", label: "Como la foto, más corto" },
];

export const ACABADOS: Option[] = [
  { id: "brillante", label: "Brillante" },
  { id: "mate", label: "Mate" },
];

export const ENTREGAS: Option[] = [
  { id: "cagua", label: "Soy de Cagua" },
  { id: "envio", label: "Necesito envío" },
];

// Las 4 tomas de medidas de manos (opcionales). El `key` coincide con la
// columna en la tabla (medida_<key>_url) y con el campo del FormData.
export const MEDIDAS: { key: string; label: string }[] = [
  { key: "der_frente", label: "Mano derecha — de frente" },
  { key: "der_perfil", label: "Mano derecha — de perfil" },
  { key: "izq_frente", label: "Mano izquierda — de frente" },
  { key: "izq_perfil", label: "Mano izquierda — de perfil" },
];

const ids = (opts: Option[]) => new Set(opts.map((o) => o.id));
const FORMA_IDS = ids(FORMAS);
const LARGO_IDS = ids(LARGOS);
const ACABADO_IDS = ids(ACABADOS);
const ENTREGA_IDS = ids(ENTREGAS);

export function labelOf(opts: Option[], id: string): string {
  return opts.find((o) => o.id === id)?.label ?? id;
}

// ─── Validación server-side de los campos de texto del formulario ───

export type PressOnFields = {
  nombre: string;
  whatsapp: string;
  forma: string;
  largo: string;
  acabado: string;
  entrega: string;
  agencia: string;
  puntoCagua: string;
  paraCuando: string; // YYYY-MM-DD o ""
  notas: string;
};

export type PressOnClean = {
  nombre: string;
  whatsappNormalizado: string;
  whatsappOriginal: string;
  pais: string;
  forma: string;
  largo: string;
  acabado: string;
  entrega: string;
  agencia: string | null;
  puntoCagua: string | null;
  paraCuando: string | null;
  notas: string | null;
};

export type PressOnValidation =
  | { ok: true; clean: PressOnClean }
  | { ok: false; campo: keyof PressOnFields; mensaje: string };

export function validatePressOn(data: PressOnFields): PressOnValidation {
  const nombre = sanitizeFreeText(data.nombre, 80);
  if (!isValidName(nombre)) {
    return { ok: false, campo: "nombre", mensaje: "Ingresa tu nombre (mínimo 2 letras)." };
  }

  const whatsappOriginal = data.whatsapp.trim();
  const phone = normalizePhoneIntl(whatsappOriginal);
  if (!phone) {
    return {
      ok: false,
      campo: "whatsapp",
      mensaje:
        "WhatsApp inválido. Si es de Venezuela usa 04XX XXXXXXX; para otros países incluye el código (ej: +54, +1, +34).",
    };
  }

  if (!FORMA_IDS.has(data.forma)) {
    return { ok: false, campo: "forma", mensaje: "Escoge la forma de uña." };
  }
  if (!LARGO_IDS.has(data.largo)) {
    return { ok: false, campo: "largo", mensaje: "Escoge el largo." };
  }
  if (!ACABADO_IDS.has(data.acabado)) {
    return { ok: false, campo: "acabado", mensaje: "Escoge el acabado (brillante o mate)." };
  }
  if (!ENTREGA_IDS.has(data.entrega)) {
    return { ok: false, campo: "entrega", mensaje: "Indica si eres de Cagua o necesitas envío." };
  }

  const agencia = sanitizeFreeText(data.agencia, 120);
  if (data.entrega === "envio" && !agencia) {
    return {
      ok: false,
      campo: "agencia",
      mensaje: "Indica la agencia de envío (el costo de envío no está incluido).",
    };
  }

  // Fecha deseada (opcional). Si viene, validar formato y que no sea pasada.
  let paraCuando: string | null = null;
  const fechaRaw = data.paraCuando.trim();
  if (fechaRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
      return { ok: false, campo: "paraCuando", mensaje: "Fecha inválida." };
    }
    paraCuando = fechaRaw;
  }

  return {
    ok: true,
    clean: {
      nombre,
      whatsappNormalizado: phone.normalized,
      whatsappOriginal,
      pais: phone.country,
      forma: data.forma,
      largo: data.largo,
      acabado: data.acabado,
      entrega: data.entrega,
      agencia: data.entrega === "envio" ? agencia : null,
      puntoCagua: sanitizeFreeText(data.puntoCagua, 120) || null,
      paraCuando,
      notas: sanitizeFreeText(data.notas, 400) || null,
    },
  };
}
