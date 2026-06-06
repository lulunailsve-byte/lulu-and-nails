import { Star } from "lucide-react";

const STARS = [0, 1, 2, 3, 4];

// Variantes de tamaño/alineación para que las tarjetas queden desalineadas y de
// distintos tamaños (efecto masonry orgánico), no en una cuadrícula pareja.
const VARIANTS = [
  "w-[97%] mr-auto",
  "w-[80%] ml-auto rotate-1",
  "w-full",
  "w-[88%] mr-auto -rotate-1",
  "w-[76%] ml-auto",
  "w-[92%] mr-auto rotate-1",
];

// Testimonios (screenshots de WhatsApp) flotando sobre un fondo hecho por
// Luizandra (collage difuminado). El fondo "entra" con un degradado arriba.
export function AboutTestimonials({ screenshots }: { screenshots: string[] }) {
  if (screenshots.length === 0) return null;

  return (
    <section id="testimonios" className="relative isolate overflow-hidden px-4 py-16">
      {/* Fondo. Se desvanece de transparente (arriba) a opaco con una máscara,
          así arriba se asoma el fondo de la sección anterior y mezcla solo (sin
          degradado blanco). Sin difuminado abajo: enseguida viene el footer. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/about-us/fondo-testimonials%202.jpg"
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 220px)",
            maskImage: "linear-gradient(to bottom, transparent 0, #000 220px)",
          }}
        />
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

        {/* Masonry desalineado, distintos tamaños */}
        <div className="mt-9 columns-2 gap-3">
          {screenshots.map((src, i) => (
            <figure
              key={src}
              className={
                "mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-[0_14px_38px_rgba(31,18,53,.30)] ring-1 ring-white/40 " +
                VARIANTS[i % VARIANTS.length]
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Reseña de una clienta de Lulu & Nails"
                loading="lazy"
                className="w-full"
              />
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
