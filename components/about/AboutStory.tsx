import type { StoryPhoto } from "@/lib/about-photos";

// Trayectoria de Luizandra en 2 columnas, pero con orden INTERCALADO para que
// leyendo de izquierda a derecha sea cronológico: la columna izquierda lleva
// los ítems 0,2,4… y la derecha 1,3,5… (en CSS columns el orden quedaba
// columna-por-columna, que se leía mal). Sin lightbox.
function Card(it: StoryPhoto) {
  return (
    <figure
      key={it.src}
      className="scroll-reveal overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_6px_22px_rgba(123,92,255,.08)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={it.src} alt={it.caption} loading="lazy" className="w-full" />
      <figcaption className="px-3 py-2.5">
        <p className="text-[12px] leading-relaxed text-ink-700">{it.caption}</p>
      </figcaption>
    </figure>
  );
}

export function AboutStory({ items }: { items: StoryPhoto[] }) {
  if (items.length === 0) return null;
  const col1: StoryPhoto[] = [];
  const col2: StoryPhoto[] = [];
  items.forEach((it, i) => (i % 2 === 0 ? col1 : col2).push(it));
  // Si la izquierda queda con una de más (total impar), pásala a la derecha
  // para balancear las columnas. Mantiene el orden cronológico al leer.
  if (col1.length > col2.length) {
    const last = col1.pop();
    if (last) col2.push(last);
  }
  return (
    <div className="mx-auto flex max-w-md items-start gap-3">
      <div className="flex w-1/2 flex-col gap-3">{col1.map(Card)}</div>
      <div className="flex w-1/2 flex-col gap-3">{col2.map(Card)}</div>
    </div>
  );
}
