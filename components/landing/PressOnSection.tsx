import { Sparkles } from "lucide-react";
import { PressOnCTAButton } from "@/components/pressonn/PressOnCTAButton";
import { PRESS_ON_GALLERY as GALLERY } from "@/lib/press-on-gallery";

const BENEFICIOS = [
  { emoji: "✨", text: "Hechas a tu medida y diseño" },
  { emoji: "⏱️", text: "Listas para poner en casa en minutos" },
  { emoji: "💪", text: "Duran semanas y son reutilizables" },
  { emoji: "🎉", text: "Perfectas para eventos y fechas importantes" },
  { emoji: "📦", text: "Envío a toda Venezuela o entrega en Cagua/Turmero" },
];

export function PressOnSection() {
  return (
    <section id="press-on" className="px-5 py-16">
      <div className="mx-auto max-w-md">
        <div className="scroll-reveal">
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
            Nuevo · Press-On
          </div>
          <h2 className="text-center font-display text-3xl font-semibold leading-tight text-ink-900">
            Uñas press-on <em className="font-normal italic text-violet-500">a tu medida</em>
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
          <p className="mt-4 text-center text-sm leading-relaxed text-ink-500">
            Kits de uñas press-on personalizados, hechos a mano según tu diseño y el
            tamaño exacto de tus uñas. Te llegan listas para ponértelas tú misma en
            casa en minutos, duran semanas y puedes reutilizarlas. Ideales para bodas,
            quinceañeras, graduaciones y cualquier evento importante. Con envío a toda
            Venezuela o entrega personal en Cagua y Turmero.
          </p>
        </div>

        {/* Galería de diseños */}
        <div className="scroll-reveal -mx-5 mt-6 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-soft">
          {GALLERY.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Diseño de uñas press-on de Lulu & Nails ${i + 1}`}
              loading="lazy"
              className="h-48 w-36 flex-shrink-0 rounded-2xl border border-violet-100 object-cover shadow-sm"
            />
          ))}
        </div>

        {/* Beneficios */}
        <ul className="scroll-reveal mt-6 space-y-2">
          {BENEFICIOS.map((b) => (
            <li
              key={b.text}
              className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white/80 px-4 py-3 text-sm text-ink-700 backdrop-blur-sm"
            >
              <span className="text-base" aria-hidden="true">
                {b.emoji}
              </span>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="scroll-reveal mt-6">
          <PressOnCTAButton className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(123,92,255,.35)] transition hover:scale-[1.01]">
            <Sparkles className="h-4 w-4" />
            Pide tus press-on personalizadas
          </PressOnCTAButton>
          <p className="mt-2 text-center text-[11px] text-ink-400">
            Llena el formulario y te escribimos por WhatsApp con el presupuesto.
          </p>
        </div>
      </div>
    </section>
  );
}
