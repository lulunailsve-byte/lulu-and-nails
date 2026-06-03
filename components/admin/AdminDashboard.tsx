"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  FORMAS,
  LARGOS,
  ACABADOS,
  ENTREGAS,
  ESTADOS,
  MEDIDAS,
  labelOf,
  type PressOnRequest,
} from "@/lib/press-on";

type Tab = "resumen" | "solicitudes" | "citas";

type Cita = {
  id: string;
  start: string;
  end: string | null;
  summary: string;
  servicio: string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
};

const ESTADO_STYLE: Record<string, string> = {
  nueva: "bg-violet-100 text-violet-700",
  presupuestada: "bg-amber-100 text-amber-800",
  confirmada: "bg-pink-100 text-pink-600",
  en_proceso: "bg-violet-200 text-violet-900",
  enviada: "bg-green-100 text-green-700",
  completada: "bg-green-200 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-VE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDateOnly(ymd: string | null): string {
  if (!ymd) return "Sin fecha";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("es-VE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function fmtCita(iso: string): string {
  return new Date(iso).toLocaleString("es-VE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Caracas",
  });
}

export function AdminDashboard({
  initialRequests,
  loadError,
}: {
  initialRequests: PressOnRequest[];
  loadError: string;
}) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [requests, setRequests] = useState<PressOnRequest[]>(initialRequests);
  const [filter, setFilter] = useState<string>("todas");
  const [refreshing, setRefreshing] = useState(false);

  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasState, setCitasState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [citasError, setCitasError] = useState("");

  // Cargar citas la primera vez que se abre la pestaña.
  useEffect(() => {
    if (tab === "citas" && citasState === "idle") void loadCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function loadCitas() {
    setCitasState("loading");
    setCitasError("");
    try {
      const res = await fetch("/api/admin/citas", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error ?? "No se pudieron cargar las citas");
      setCitas(data.citas ?? []);
      setCitasState("loaded");
    } catch (e) {
      setCitasError(e instanceof Error ? e.message : "Error");
      setCitasState("error");
    }
  }

  async function refreshRequests() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/requests", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) setRequests(data.requests ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  async function updateEstado(id: string, estado: string) {
    const prev = requests;
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, estado } : r)));
    try {
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
    } catch {
      setRequests(prev); // revertir
      alert("No se pudo actualizar el estado. Intenta de nuevo.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  const filtered = useMemo(
    () => (filter === "todas" ? requests : requests.filter((r) => r.estado === filter)),
    [requests, filter],
  );

  const stats = useMemo(() => {
    const nuevas = requests.filter((r) => r.estado === "nueva").length;
    const activas = requests.filter(
      (r) => !["completada", "cancelada"].includes(r.estado),
    ).length;
    const completadas = requests.filter((r) => r.estado === "completada").length;
    return { total: requests.length, nuevas, activas, completadas };
  }, [requests]);

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "solicitudes", label: "Press-On", icon: Sparkles },
    { id: "citas", label: "Citas", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-violet-50/40 text-ink-900">
      {/* Sidebar (PC / tablet) */}
      <aside className="fixed left-0 top-0 hidden h-screen w-56 flex-col border-r border-violet-100 bg-white p-4 md:flex">
        <div className="px-2 py-3">
          <div className="font-display text-lg font-semibold">Lulu &amp; Nails</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
            Panel
          </div>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {navItems.map((it) => (
            <NavButton key={it.id} active={tab === it.id} onClick={() => setTab(it.id)} icon={it.icon}>
              {it.label}
            </NavButton>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="md:pl-56">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-violet-100 bg-white/90 px-4 py-3 backdrop-blur">
          <h1 className="font-display text-lg font-semibold capitalize">
            {tab === "solicitudes" ? "Solicitudes Press-On" : tab}
          </h1>
          {tab === "solicitudes" && (
            <button
              onClick={refreshRequests}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 disabled:opacity-50"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (refreshing ? "animate-spin" : "")} />
              Actualizar
            </button>
          )}
          {tab === "citas" && (
            <button
              onClick={loadCitas}
              disabled={citasState === "loading"}
              className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 disabled:opacity-50"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (citasState === "loading" ? "animate-spin" : "")} />
              Actualizar
            </button>
          )}
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 md:pb-10">
          {loadError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {loadError}
            </div>
          )}

          {tab === "resumen" && (
            <ResumenTab stats={stats} requests={requests} onGoSolicitudes={() => setTab("solicitudes")} />
          )}

          {tab === "solicitudes" && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <FilterChip label="Todas" active={filter === "todas"} onClick={() => setFilter("todas")} count={requests.length} />
                {ESTADOS.map((e) => {
                  const count = requests.filter((r) => r.estado === e.id).length;
                  if (count === 0) return null;
                  return (
                    <FilterChip key={e.id} label={e.label} active={filter === e.id} onClick={() => setFilter(e.id)} count={count} />
                  );
                })}
              </div>
              {filtered.length === 0 ? (
                <EmptyState text="No hay solicitudes en esta vista todavía." />
              ) : (
                <div className="space-y-4">
                  {filtered.map((r) => (
                    <RequestCard key={r.id} r={r} onEstado={updateEstado} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "citas" && (
            <CitasTab state={citasState} error={citasError} citas={citas} />
          )}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-violet-100 bg-white/95 backdrop-blur md:hidden">
        {navItems.map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition " +
                (active ? "text-violet-600" : "text-ink-400")
              }
            >
              <Icon className="h-5 w-5" />
              {it.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────

function NavButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition " +
        (active ? "bg-violet-500 text-white shadow-[0_4px_14px_rgba(123,92,255,.3)]" : "text-ink-500 hover:bg-violet-50")
      }
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ResumenTab({
  stats,
  requests,
  onGoSolicitudes,
}: {
  stats: { total: number; nuevas: number; activas: number; completadas: number };
  requests: PressOnRequest[];
  onGoSolicitudes: () => void;
}) {
  const recientes = requests.slice(0, 5);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Nuevas" value={stats.nuevas} accent />
        <StatCard label="Activas" value={stats.activas} />
        <StatCard label="Completadas" value={stats.completadas} />
        <StatCard label="Total" value={stats.total} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Últimas solicitudes</h2>
        <button onClick={onGoSolicitudes} className="text-xs font-bold text-violet-600">
          Ver todas →
        </button>
      </div>
      {recientes.length === 0 ? (
        <EmptyState text="Aún no hay solicitudes. Cuando una clienta envíe el formulario, aparece aquí." />
      ) : (
        <div className="mt-3 divide-y divide-violet-100 overflow-hidden rounded-2xl border border-violet-100 bg-white">
          {recientes.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{r.nombre}</div>
                <div className="text-[11px] text-ink-500">{fmtDateTime(r.created_at)}</div>
              </div>
              <EstadoBadge estado={r.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border p-4 " +
        (accent ? "border-violet-200 bg-gradient-to-br from-violet-500 to-pink-400 text-white" : "border-violet-100 bg-white")
      }
    >
      <div className={"font-display text-3xl font-semibold " + (accent ? "text-white" : "text-ink-900")}>
        {value}
      </div>
      <div className={"mt-1 text-[11px] font-semibold uppercase tracking-wider " + (accent ? "text-white/80" : "text-ink-400")}>
        {label}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide " +
        (ESTADO_STYLE[estado] ?? "bg-ink-900/5 text-ink-500")
      }
    >
      {labelOf(ESTADOS, estado)}
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-xs font-bold transition " +
        (active ? "bg-ink-900 text-white" : "bg-white text-ink-700 shadow-sm hover:bg-violet-50")
      }
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}

function RequestCard({
  r,
  onEstado,
}: {
  r: PressOnRequest;
  onEstado: (id: string, estado: string) => void;
}) {
  const fotos: { label: string; url: string | null }[] = [
    { label: "Referencia", url: r.referencia_url },
    ...MEDIDAS.map((m) => ({
      label: m.label,
      url: (r as unknown as Record<string, string | null>)[`medida_${m.key}_url`] ?? null,
    })),
  ];
  const conFoto = fotos.filter((f) => f.url);

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_4px_18px_rgba(123,92,255,.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-violet-50 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-bold">{r.nombre}</div>
          <div className="text-[11px] text-ink-500">{fmtDateTime(r.created_at)}</div>
        </div>
        <EstadoBadge estado={r.estado} />
      </div>

      <div className="space-y-1.5 px-4 py-3 text-sm">
        <InfoRow label="WhatsApp">
          <a
            href={`https://wa.me/${r.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-green-700"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {r.whatsapp_original || r.whatsapp}
            {r.pais ? <span className="text-ink-400">· {r.pais}</span> : null}
          </a>
        </InfoRow>
        <InfoRow label="Diseño">
          {labelOf(FORMAS, r.forma)} · {labelOf(LARGOS, r.largo)} · {labelOf(ACABADOS, r.acabado)}
        </InfoRow>
        <InfoRow label="Entrega">
          {labelOf(ENTREGAS, r.entrega)}
          {r.entrega === "envio" && r.agencia ? ` · ${r.agencia}` : ""}
        </InfoRow>
        {r.punto_cagua && <InfoRow label="Punto Cagua">{r.punto_cagua}</InfoRow>}
        <InfoRow label="Para">{fmtDateOnly(r.para_cuando)}</InfoRow>
        {r.notas && <InfoRow label="Notas">{r.notas}</InfoRow>}
      </div>

      {/* Fotos */}
      {conFoto.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-soft">
          {conFoto.map((f) => (
            <a
              key={f.label}
              href={f.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative shrink-0"
              title={f.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url!}
                alt={f.label}
                className="h-20 w-20 rounded-xl border border-violet-100 object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 truncate rounded-b-xl bg-ink-900/60 px-1 py-0.5 text-[8px] font-semibold text-white">
                {f.label}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-2 border-t border-violet-50 bg-violet-50/40 px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Estado</span>
        <select
          value={r.estado}
          onChange={(e) => onEstado(r.id, e.target.value)}
          className="rounded-lg border-2 border-violet-100 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-900 outline-none focus:border-violet-400"
        >
          {ESTADOS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <a
          href={`https://wa.me/${r.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Escribir
        </a>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-ink-700">{children}</span>
    </div>
  );
}

function CitasTab({
  state,
  error,
  citas,
}: {
  state: "idle" | "loading" | "loaded" | "error";
  error: string;
  citas: Cita[];
}) {
  if (state === "loading" || state === "idle") {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-violet-700">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando citas…
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        No se pudieron cargar las citas: {error}
      </div>
    );
  }
  if (citas.length === 0) {
    return <EmptyState text="No hay citas próximas en el calendario." />;
  }
  return (
    <div className="space-y-3">
      {citas.map((c) => (
        <div key={c.id} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_4px_18px_rgba(123,92,255,.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{c.summary || "Cita"}</div>
              {c.servicio && <div className="text-[11px] text-ink-500">{c.servicio}</div>}
            </div>
            <div className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
              {fmtCita(c.start)}
            </div>
          </div>
          {(c.whatsapp || c.telefono) && (
            <a
              href={`https://wa.me/${c.whatsapp ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-green-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {c.telefono ?? c.whatsapp}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-violet-200 bg-white/60 px-6 py-12 text-center">
      <ExternalLink className="mb-2 h-6 w-6 text-violet-300" />
      <p className="max-w-xs text-sm text-ink-500">{text}</p>
    </div>
  );
}
