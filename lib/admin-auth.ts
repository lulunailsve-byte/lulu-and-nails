import { createHmac, timingSafeEqual } from "crypto";

// Autenticación del panel admin (/press-on). Un solo usuario, credenciales en
// env vars (Vercel):
//   ADMIN_USER       -> usuario
//   ADMIN_PASSWORD   -> contraseña (también se usa como clave del HMAC de sesión)
//
// La cookie de sesión es httpOnly + Secure y guarda un HMAC firmado con la
// contraseña, así que no es falsificable sin conocerla y cambia si se rota.

export const ADMIN_COOKIE = "lulu_admin";
const TOKEN_PAYLOAD = "v1";

function getCreds(): { user: string; pass: string } {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) throw new Error("Faltan ADMIN_USER / ADMIN_PASSWORD");
  return { user, pass };
}

// Comparación de tiempo constante para evitar timing attacks.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyCredentials(user: string, pass: string): boolean {
  const c = getCreds();
  // Evaluar ambos siempre (no short-circuit) para no filtrar cuál falló.
  const okU = safeEqual(user, c.user);
  const okP = safeEqual(pass, c.pass);
  return okU && okP;
}

export function makeSessionToken(): string {
  const c = getCreds();
  const sig = createHmac("sha256", c.pass).update(TOKEN_PAYLOAD).digest("hex");
  return `${TOKEN_PAYLOAD}.${sig}`;
}

export function isValidSession(token: string | undefined | null): boolean {
  if (!token) return false;
  let c: { user: string; pass: string };
  try {
    c = getCreds();
  } catch {
    return false;
  }
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", c.pass).update(payload).digest("hex");
  return safeEqual(sig, expected);
}
