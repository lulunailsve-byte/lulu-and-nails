import type { StoryPhoto } from "@/lib/about-photos";

// Trayectoria de Luizandra: fotos en orden cronológico con su pie de foto,
// en una sola columna (preserva el orden de la historia). Sin lightbox.
export function AboutStory({ items }: { items: StoryPhoto[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mx-auto max-w-md space-y-5">
      {items.map((it, i) => (
        <figure
          key={it.src}
          className="scroll-reveal overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_6px_22px_rgba(123,92,255,.08)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.src} alt={it.caption} loading="lazy" className="w-full" />
          <figcaption className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 font-display text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink-700">{it.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
