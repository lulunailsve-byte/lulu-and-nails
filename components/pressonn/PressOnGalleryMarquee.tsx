"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Galería tipo marquee: avanza sola (lento, infinito) PERO se puede controlar
// con el dedo (al tocar pausa y deja arrastrar; retoma sola). Al tocar una
// foto (tap, no arrastre) abre un lightbox con la imagen completa, navegable
// con flechas, teclado y swipe táctil. El lightbox se renderiza vía portal a
// document.body para que su z-index sea global.
export function PressOnGalleryMarquee({
  images,
  reverse = false,
}: {
  images: string[];
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<number | null>(null);
  const downScrollRef = useRef(0);

  const [idx, setIdx] = useState<number | null>(null);
  const open = idx !== null;
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Auto-scroll continuo por TIEMPO (px/seg) — velocidad constante sin importar
  // el FPS del monitor (en 120/144Hz no se acelera). Basado en scrollLeft, así
  // se puede arrastrar con el dedo.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (reverse) el.scrollLeft = el.scrollWidth / 2;
    let raf = 0;
    let last = performance.now();
    const pxPerSec = 40; // lento pero visible
    const step = (now: number) => {
      const dt = Math.min(now - last, 50); // clamp por si la pestaña estuvo en background
      last = now;
      if (!pausedRef.current && !openRef.current && el.scrollWidth > el.clientWidth + 4) {
        const half = el.scrollWidth / 2;
        const move = (pxPerSec * dt) / 1000;
        if (reverse) {
          el.scrollLeft -= move;
          if (el.scrollLeft <= 0) el.scrollLeft += half;
        } else {
          el.scrollLeft += move;
          if (el.scrollLeft >= half) el.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reverse, images.length]);

  function pauseScroll() {
    pausedRef.current = true;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  }
  function scheduleResume() {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, 1800);
  }

  // Deslizar manualmente con las flechitas (sobre todo en desktop, donde no hay swipe).
  function nudge(dir: number) {
    const el = trackRef.current;
    if (!el) return;
    pauseScroll();
    scheduleResume();
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const go = (delta: number) =>
    setIdx((i) => (i === null ? i : (i + delta + images.length) % images.length));

  // Lightbox: teclado + bloquear scroll de fondo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, images.length]);

  const touchX = useRef(0);
  const doubled = [...images, ...images];

  return (
    <>
      <div className="relative -mx-5 mt-7">
        <div
          ref={trackRef}
          data-lenis-prevent
          onPointerDown={() => {
            pauseScroll();
            downScrollRef.current = trackRef.current?.scrollLeft ?? 0;
          }}
          onPointerUp={scheduleResume}
          onPointerCancel={scheduleResume}
          onPointerLeave={scheduleResume}
          onWheel={(e) => {
            // Solo pausar con scroll horizontal; el vertical es scroll de página.
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
              pauseScroll();
              scheduleResume();
            }
          }}
          className="no-scrollbar overflow-x-auto"
        >
          <div className="flex w-max">
          {doubled.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label="Ampliar foto"
              onClick={() => {
                const el = trackRef.current;
                // Si hubo scroll/arrastre desde el pointerdown, fue swipe → no abrir.
                if (el && Math.abs(el.scrollLeft - downScrollRef.current) > 6) return;
                setIdx(i % images.length);
              }}
              className="mr-3 aspect-[3/4] w-40 flex-shrink-0 overflow-hidden rounded-2xl border border-violet-100 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Diseño de Lulu & Nails"
                draggable={false}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
          </div>
        </div>

        {/* Flechitas para deslizar (sobre todo en desktop, sin swipe) */}
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => nudge(-1)}
          className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink-700 shadow-md backdrop-blur transition hover:bg-white sm:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          onClick={() => nudge(1)}
          className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink-700 shadow-md backdrop-blur transition hover:bg-white sm:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/90 p-4 backdrop-blur-sm"
            onClick={() => setIdx(null)}
            onTouchStart={(e) => {
              touchX.current = e.touches[0]?.clientX ?? 0;
            }}
            onTouchEnd={(e) => {
              const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <button
              aria-label="Cerrar"
              onClick={() => setIdx(null)}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              aria-label="Anterior"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:left-5"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[idx!]}
              alt="Diseño de Lulu & Nails"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-[92vw] select-none rounded-2xl object-contain shadow-2xl"
            />

            <button
              aria-label="Siguiente"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:right-5"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {idx! + 1} / {images.length}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
