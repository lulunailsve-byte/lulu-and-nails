import { Star } from "lucide-react";

const STARS = [0, 1, 2, 3, 4];

// Testimonios (screenshots de WhatsApp): un fondo hecho con los mismos
// screenshots pero difuminados, y encima los screenshots nítidos "flotando".
export function AboutTestimonials({ screenshots }: { screenshots: string[] }) {
  if (screenshots.length === 0) return null;

  // Collage de fondo: repetimos los screenshots para cubrir el alto.
  const bg = [...screenshots, ...screenshots, ...screenshots].slice(0, 36);

  return (
    <section id="testimonios" className="relative overflow-hidden px-5 py-16">
      {/* Fondo difuminado */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="grid scale-110 grid-cols-3 gap-1 opacity-50 blur-2xl">
          {bg.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="aspect-[9/16] w-full object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-warm-white/80 via-pink-50/55 to-warm-white/85" />
      </div>

      <div className="mx-auto max-w-md">
        <div className="text-center">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
            Testimonios
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink-900">
            Lo que dicen mis <em className="font-normal italic text-violet-500">clientas</em>
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
        </div>

        {/* Screenshots nítidos flotando */}
        <div className="mt-8 columns-2 gap-3">
          {screenshots.map((src) => (
            <figure
              key={src}
              className="mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-[0_12px_34px_rgba(31,18,53,.16)] ring-1 ring-white/70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Reseña de una clienta de Lulu & Nails" loading="lazy" className="w-full" />
              <figcaption className="flex items-center gap-0.5 px-3 py-2">
                {STARS.map((s) => (
                  <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
