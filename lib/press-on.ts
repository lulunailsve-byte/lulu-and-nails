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
  { id: "cortas", label: "Cortas (Talla S)" },
  { id: "medianas", label: "Medianas (Talla M)" },
  { id: "largas", label: "Largas (Talla L)" },
  { id: "extra_largas", label: "Extra largas (Talla XL)" },
];

export const ACABADOS: Option[] = [
  { id: "brillante", label: "Brillante" },
  { id: "mate", label: "Mate" },
];

export const ENTREGAS: Option[] = [
  { id: "cagua", label: "Entrega personal (Cagua, Turmero)" },
  { id: "envio", label: "Necesito envío" },
];

// Agencias de envío disponibles. El envío es pago destino.
export const AGENCIAS: Option[] = [
  { id: "zoom", label: "Zoom" },
  { id: "tealca", label: "Tealca" },
];

// Estados del flujo de trabajo de una solicitud (para el panel admin).
export const ESTADOS: Option[] = [
  { id: "nueva", label: "Nueva" },
  { id: "presupuestada", label: "Presupuestada" },
  { id: "confirmada", label: "Confirmada" },
  { id: "en_proceso", label: "En proceso" },
  { id: "enviada", label: "Enviada" },
  { id: "completada", label: "Completada" },
  { id: "cancelada", label: "Cancelada" },
];

export function isValidEstado(id: string): boolean {
  return ESTADOS.some((e) => e.id === id);
}

// Fila de la tabla press_on_requests (lo que devuelve Supabase).
export type PressOnRequest = {
  id: string;
  created_at: string;
  nombre: string;
  whatsapp: string;
  whatsapp_original: string | null;
  pais: string | null;
  forma: string;
  largo: string;
  acabado: string;
  referencia_url: string | null;
  notas: string | null;
  medida_der_frente_url: string | null;
  medida_der_perfil_url: string | null;
  medida_izq_frente_url: string | null;
  medida_izq_perfil_url: string | null;
  entrega: string;
  agencia: string | null;
  direccion_envio: string | null;
  punto_cagua: string | null;
  para_cuando: string | null;
  estado: string;
  fuente: string;
};

// Las 4 tomas de medidas de manos (opcionales). El `key` coincide con la
// columna en la tabla (medida_<key>_url) y con el campo del FormData.
export const MEDIDAS: { key: string; label: string }[] = [
  { key: "der_frente", label: "Mano derecha · cuatro dedos" },
  { key: "der_perfil", label: "Mano derecha · solo pulgar" },
  { key: "izq_frente", label: "Mano izquierda · cuatro dedos" },
  { key: "izq_perfil", label: "Mano izquierda · solo pulgar" },
];

const ids = (opts: Option[]) => new Set(opts.map((o) => o.id));
const FORMA_IDS = ids(FORMAS);
const LARGO_IDS = ids(LARGOS);
const ACABADO_IDS = ids(ACABADOS);
const ENTREGA_IDS = ids(ENTREGAS);
const AGENCIA_IDS = ids(AGENCIAS);

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
  agencia: string;          // id de AGENCIAS si entrega = envio
  direccionEnvio: string;   // dirección de la agencia si entrega = envio
  paraCuando: string;       // YYYY-MM-DD o ""
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
  direccionEnvio: string | null;
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

  // Envío: agencia (dropdown) + dirección de la agencia, ambos obligatorios.
  let agencia: string | null = null;
  let direccionEnvio: string | null = null;
  if (data.entrega === "envio") {
    if (!AGENCIA_IDS.has(data.agencia)) {
      return { ok: false, campo: "agencia", mensaje: "Selecciona la agencia de envío (Zoom o Tealca)." };
    }
    agencia = data.agencia;
    direccionEnvio = sanitizeFreeText(data.direccionEnvio, 200);
    if (!direccionEnvio) {
      return { ok: false, campo: "direccionEnvio", mensaje: "Indica la dirección de la agencia de envío." };
    }
  }

  // Fecha deseada (opcional). Si viene, validar formato.
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
      agencia,
      direccionEnvio,
      paraCuando,
      notas: sanitizeFreeText(data.notas, 400) || null,
    },
  };
}
