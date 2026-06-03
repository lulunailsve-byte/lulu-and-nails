import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, makeSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { user?: string; password?: string };
  try {
    body = (await req.json()) as { user?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }

  let ok = false;
  try {
    ok = verifyCredentials(body.user ?? "", body.password ?? "");
  } catch {
    return NextResponse.json(
      { ok: false, error: "Acceso no configurado en el servidor (faltan ADMIN_USER / ADMIN_PASSWORD)." },
      { status: 500 },
    );
  }

  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Usuario o contraseña incorrectos." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
