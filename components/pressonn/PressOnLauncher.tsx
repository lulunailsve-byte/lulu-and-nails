"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { PressOnForm } from "./PressOnForm";
import { OPEN_PRESS_ON_EVENT } from "./pressOnModal";

// Aviso pequeño y dismissible (centro vertical, borde izquierdo) que abre el
// formulario de kits Press-On. Aparece SOLO cuando la sección "Reserva express"
// (#reservar) está en pantalla, para no tapar el hero inicial. Entra con una
// animación suave (fade + scale).
export function PressOnLauncher() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = document.getElementById("reservar");
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setShown(!!entries[0]?.isIntersecting),
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Abrir el modal cuando cualquier botón de la página dispara el evento.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_PRESS_ON_EVENT, handler);
    return () => window.removeEventListener(OPEN_PRESS_ON_EVENT, handler);
  }, []);

  return (
    <>
      {!dismissed && (
        <div className="fixed left-3 top-1/2 z-40 -translate-y-1/2 sm:left-5">
          <div
            className={
              "relative transition-all duration-500 ease-out " +
              (shown && !open
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-90 opacity-0")
            }
          >
            {/* Halo de pulso para atraer la mirada */}
            <span className="pointer-events-none absolute -inset-1 -z-10 animate-pulse rounded-2xl bg-gradient-to-r from-violet-300/50 to-pink-300/50 blur-md" />

            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2.5 rounded-2xl border border-violet-100 bg-white/95 py-2.5 pl-2.5 pr-4 text-left shadow-[0_10px_30px_rgba(123,92,255,.25)] backdrop-blur transition hover:scale-[1.03]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-400 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[9px] font-bold uppercase tracking-[.15em] text-pink-500">
                  Nuevo ✨
                </span>
                <span className="block text-[13px] font-bold text-ink-900">Kits Press-On</span>
                <span className="block text-[10px] text-ink-500">Pídelos a tu medida →</span>
              </span>
            </button>

            <button
              onClick={() => setDismissed(true)}
              aria-label="Cerrar aviso"
              className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink-900 text-white shadow-md transition hover:scale-110"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {open && <PressOnForm onClose={() => setOpen(false)} />}
    </>
  );
}
