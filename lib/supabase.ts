import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase de SERVIDOR (service role). Bypasa RLS, así que NUNCA debe
// usarse en el cliente ni exponerse al browser. Solo en Route Handlers / server.
//
// Env vars (Vercel → Production):
//   SUPABASE_URL                  -> https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     -> service_role secret (Supabase → Settings → API)

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  // Aceptamos algunos alias comunes para tolerar pequeñas variaciones de nombre
  // al configurar las env vars (ej. el snippet de Supabase sugiere
  // NEXT_PUBLIC_SUPABASE_URL). La KEY debe ser el service_role (secreto) — el
  // anon no sirve porque la tabla tiene RLS.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    const faltan = [
      url ? null : "SUPABASE_URL",
      key ? null : "SUPABASE_SERVICE_ROLE_KEY",
    ]
      .filter(Boolean)
      .join(" + ");
    throw new Error(`Faltan variables de Supabase en el servidor: ${faltan}`);
  }
  if (cached) return cached;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Bucket de Storage donde viven las fotos de las solicitudes Press-On.
export const PRESS_ON_BUCKET = "press-on-photos";
