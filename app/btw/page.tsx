import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { PressOnRequest } from "@/lib/press-on";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel · Lulu & Nails",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;

  let authed = false;
  try {
    authed = isValidSession(token);
  } catch {
    authed = false;
  }

  if (!authed) {
    return <AdminLogin />;
  }

  let requests: PressOnRequest[] = [];
  let loadError = "";
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("press_on_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    requests = (data ?? []) as PressOnRequest[];
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudieron cargar las solicitudes";
  }

  return <AdminDashboard initialRequests={requests} loadError={loadError} />;
}
