"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export function AdminLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error ?? "No se pudo iniciar sesión");
      // La página es server-side y lee la cookie nueva al recargar.
      window.location.reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-violet-50 via-pink-50 to-warm-white px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-violet-100 bg-white p-7 shadow-[0_12px_40px_rgba(123,92,255,.15)]"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-400 text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold text-ink-900">
          Panel · Lulu &amp; Nails
        </h1>
        <p className="mt-1 text-center text-sm text-ink-500">Acceso privado</p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-violet-700">
              Usuario
            </span>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              disabled={loading}
              className="w-full rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-violet-700">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border-2 border-violet-100 bg-warm-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white disabled:opacity-50"
            />
          </label>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !user || !password}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(123,92,255,.35)] disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Entrar
        </button>
      </form>
    </main>
  );
}
