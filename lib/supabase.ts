import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase de SERVIDOR (service role). Bypasa RLS, así que NUNCA debe
// usarse en el cliente ni exponerse al browser. Solo en Route Handlers / server.
//
// Env vars (Vercel → Production):
//   SUPABASE_URL                  -> https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     -> service_role secret (Supabase → Settings → API)

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  if (cached) return cached;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Bucket de Storage donde viven las fotos de las solicitudes Press-On.
export const PRESS_ON_BUCKET = "press-on-photos";
