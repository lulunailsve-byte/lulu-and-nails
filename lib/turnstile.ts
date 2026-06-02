// Verificación server-side de Cloudflare Turnstile (anti-bot), compartida
// entre /api/book y /api/press-on.

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifyResp = {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
};

// Verifica un token de Cloudflare Turnstile contra el endpoint de siteverify.
// Si TURNSTILE_SECRET_KEY no está seteado (dev sin Turnstile), permite el paso
// y solo loguea un warning. En producción debe estar siempre seteado.
export async function verifyTurnstile(
  token: string,
  remoteip?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn(
      "TURNSTILE_SECRET_KEY no está seteado — saltando verificación. NO HACER EN PROD.",
    );
    return { ok: true };
  }
  if (!token) {
    return { ok: false, reason: "missing-input-response" };
  }
  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (remoteip) form.append("remoteip", remoteip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = (await res.json()) as TurnstileVerifyResp;
    if (data.success) return { ok: true };
    return { ok: false, reason: (data["error-codes"] ?? []).join(",") || "verify-failed" };
  } catch (err) {
    console.error("turnstile verify error:", err);
    return { ok: false, reason: "verify-error" };
  }
}

// Mapea los códigos de error de Cloudflare Turnstile a mensajes amigables en español.
// Refs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#error-codes
export function turnstileFriendly(reason?: string): {
  mensaje: string;
  cooldownSeconds: number; // sugerencia: cuánto esperar antes de reintentar
} {
  const codes = (reason ?? "").split(",").map((c) => c.trim()).filter(Boolean);

  // El caso clásico: token reutilizado, expirado o muchos intentos seguidos.
  if (codes.includes("timeout-or-duplicate") || codes.includes("rate-limit")) {
    return {
      mensaje:
        "¡Tranquilo! 💜 Has hecho muchos intentos seguidos. Espera un momento y vuelve a intentar.",
      cooldownSeconds: 60,
    };
  }
  if (codes.includes("missing-input-response")) {
    return {
      mensaje:
        "Falta completar la verificación anti-bot. Espera a que termine y vuelve a darle clic.",
      cooldownSeconds: 5,
    };
  }
  if (codes.includes("invalid-input-response")) {
    return {
      mensaje:
        "La verificación expiró o no es válida. Refresca la página y vuelve a empezar.",
      cooldownSeconds: 10,
    };
  }
  if (codes.includes("internal-error") || codes.includes("verify-error")) {
    return {
      mensaje: "Cloudflare está teniendo un problema. Intenta de nuevo en un minuto.",
      cooldownSeconds: 60,
    };
  }
  // Default: catch-all amigable
  return {
    mensaje: "No pudimos confirmar que eres humano. Refresca la página e intenta otra vez.",
    cooldownSeconds: 30,
  };
}
