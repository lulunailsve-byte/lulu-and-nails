import { readdirSync } from "node:fs";
import path from "node:path";
import { Star } from "lucide-react";

// Lee las fotos de testimonios de public/testimonials/ y las clasifica:
//   - nombre contiene "hand" → foto de manos (resultado real)
//   - nombre contiene "ss"   → screenshot de WhatsApp (reseña)
// Para actualizar: agrega/quita imágenes en esa carpeta (se incluyen en build).

type Item = { src: string; type: "hand" | "ss" };

function loadTestimonios(): Item[] {
  try {
    const dir = path.join(process.cwd(), "public", "testimonials");
    const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    const items: Item[] = files.map((f) => {
      const lower = f.toLowerCase();
      const type: "hand" | "ss" = lower.includes("hand")
        ? "hand"
        : lower.includes("ss")
          ? "ss"
          : "hand";
      return { src: `/testimonials/${encodeURIComponent(f)}`, type };
    });
    // Intercalar screenshots y manos para una mezcla visual más rica.
    const ss = items.filter((i) => i.type === "ss");
    const hands = items.filter((i) => i.type === "hand");
    const out: Item[] = [];
    const n = Math.max(ss.length, hands.length);
    for (let i = 0; i < n; i++) {
      if (ss[i]) out.push(ss[i]!);
      if (hands[i]) out.push(hands[i]!);
    }
    return out;
  } catch {
    return [];
  }
}

const STARS = [0, 1, 2, 3, 4];

export function Testimonials() {
  const items = loadTestimonios();
  if (items.length === 0) return null;

  return (
    <section id="testimonios" className="px-5 py-14">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
            Testimonios
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink-900">
            Lo que viven mis <em className="font-normal italic text-violet-500">clientas</em>
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Resultados reales y reseñas de quienes ya estrenaron sus kits press-on. 💜
          </p>
        </div>

        <div className="mt-8 columns-2 gap-3">
          {items.map((it, idx) => (
            <figure
              key={it.src + idx}
              className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.src}
                alt={it.type === "hand" ? "Resultado real de una clienta" : "Reseña de una clienta"}
                loading="lazy"
                className="w-full"
              />
              <figcaption className="px-3 py-2.5">
                <div className="flex items-center gap-0.5">
                  {STARS.map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="mt-1 text-[11px] font-bold text-violet-600">
                  {it.type === "hand" ? "Resultados reales" : "Lo que dicen mis clientas"}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
