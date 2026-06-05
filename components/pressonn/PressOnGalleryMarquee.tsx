"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Galería de diseños press-on: marquee horizontal infinito (lento, siempre
// avanza). Al tocar una foto se abre un lightbox con la imagen completa
// (object-contain) y flechas para navegar.
export function PressOnGalleryMarquee({ images }: { images: string[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  const open = idx !== null;

  const go = (delta: number) =>
    setIdx((i) => (i === null ? i : (i + delta + images.length) % images.length));

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

  // Dos copias seguidas → loop continuo sin saltos.
  const doubled = [...images, ...images];

  return (
    <>
      <div className="-mx-5 mt-7 overflow-hidden">
        <div className="presson-marquee flex w-max">
          {doubled.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i % images.length)}
              aria-label="Ampliar diseño"
              className="mr-3 aspect-[3/4] w-40 flex-shrink-0 overflow-hidden rounded-2xl border border-violet-100 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Diseño de kit press-on de Lulu & Nails"
                loading="lazy"
                className="h-full w-full object-cover transition hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/90 p-4 backdrop-blur-sm"
          onClick={() => setIdx(null)}
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
            alt="Diseño de kit press-on de Lulu & Nails"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
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
        </div>
      )}
    </>
  );
}
