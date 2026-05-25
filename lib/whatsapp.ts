// Cliente mínimo de Green API para enviar mensajes de WhatsApp.
// Docs: https://green-api.com/en/docs/api/sending/SendMessage/

const GREEN_API_BASE = "https://api.green-api.com";

export type SendResult = { ok: true; idMessage: string } | { ok: false; error: string };

/**
 * Envía un mensaje de texto por WhatsApp via Green API.
 * @param phoneDigits teléfono normalizado solo en dígitos con código país (ej: "584143441103").
 * @param text contenido del mensaje (soporta *negrita*, _cursiva_, ~tachado~).
 */
export async function sendWhatsAppMessage(
  phoneDigits: string,
  text: string,
): Promise<SendResult> {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!idInstance || !apiToken) {
    return { ok: false, error: "Faltan GREEN_API_INSTANCE_ID / GREEN_API_TOKEN" };
  }

  // chatId formato Green API: "{phone}@c.us" para individuales.
  const chatId = `${phoneDigits}@c.us`;

  const url = `${GREEN_API_BASE}/waInstance${idInstance}/sendMessage/${apiToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message: text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = (await res.json()) as { idMessage?: string };
    if (!data.idMessage) {
      return { ok: false, error: "Respuesta sin idMessage" };
    }
    return { ok: true, idMessage: data.idMessage };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: `Network: ${msg}` };
  }
}
