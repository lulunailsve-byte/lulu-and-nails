import { NextRequest, NextResponse } from "next/server";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isValidEstado } from "@/lib/press-on";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(req: NextRequest): boolean {
  try {
    return isValidSession(req.cookies.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

// GET /api/admin/requests — lista todas las solicitudes (más recientes primero).
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("press_on_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, requests: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/requests — actualiza el estado de una solicitud.
export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; estado?: string };
  try {
    body = (await req.json()) as { id?: string; estado?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }
  if (!body.id || !body.estado || !isValidEstado(body.estado)) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("press_on_requests")
      .update({ estado: body.estado })
      .eq("id", body.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
