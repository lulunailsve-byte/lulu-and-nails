import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { PressOnFormCore } from "@/components/pressonn/PressOnFormCore";
import { Testimonials } from "@/components/pressonn/Testimonials";
import { FooterSection } from "@/components/landing/FooterSection";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { PRESS_ON_GALLERY } from "@/lib/press-on-gallery";

const DESCRIPTION =
  "Uñas press-on hechas a tu medida y diseño, listas para usar en casa en minutos. Duran semanas, reutilizables y perfectas para eventos. Envío a toda Venezuela o entrega en Cagua y Turmero.";

export const metadata: Metadata = {
  title: "Kits Press-On personalizados | Lulu & Nails",
  description: DESCRIPTION,
  alternates: { canonical: "/press-on" },
  openGraph: {
    title: "Kits Press-On personalizados — Lulu & Nails",
    description: DESCRIPTION,
    url: "/press-on",
    type: "website",
    locale: "es_VE",
    images: ["/og-image.jpg"],
  },
};

const BENEFITS = [
  "Hechas a tu medida y con tu diseño",
  "Listas para ponértelas en casa en minutos",
  "Duran semanas y son reutilizables",
  "Perfectas para eventos: bodas, quinceañeras, graduaciones",
  "Envío a toda Venezuela o entrega en Cagua/Turmero",
];

const PASOS = [
  { n: "1", t: "Llena el formulario", d: "Tu diseño, forma, largo, acabado y medidas." },
  { n: "2", t: "Te enviamos el presupuesto", d: "Por WhatsApp, con los colores disponibles y la tasa BCV." },
  { n: "3", t: "Confirmas con el pago", d: "Apartas tu kit y empezamos a hacerlo." },
  { n: "4", t: "Recíbelas en 1 a 2 días", d: "Con envío nacional o entrega personal." },
];

export default function PressOnPage() {
  return (
    <main className="bg-gradient-to-b from-violet-50 via-pink-50 to-warm-white">
      {/* Volver */}
      <div className="px-5 pt-5">
        <div className="mx-auto max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </div>

      {/* Hero / intro extendido */}
      <section className="px-5 pb-10 pt-6">
        <div className="mx-auto max-w-md text-center">
          <span className="inline-block rounded-full bg-gradient-to-r from-violet-500 to-pink-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-white">
            Nuevo ✨ · Press-On
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] text-ink-900">
            Kits Press-On <em className="font-normal italic text-violet-500">a tu medida</em>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-500">{DESCRIPTION}</p>
        </div>

        {/* Galería de diseños (strip horizontal) */}
        <div className="-mx-5 mt-7 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-soft">
          {PRESS_ON_GALLERY.map((src) => (
            <div key={src} className="aspect-[3/4] w-40 flex-shrink-0 overflow-hidden rounded-2xl border border-violet-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Diseño de kit press-on de Lulu & Nails" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        {/* Beneficios */}
        <ul className="mx-auto mt-7 max-w-md space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 rounded-2xl border border-violet-100 bg-white/80 p-3 text-sm text-ink-700 backdrop-blur-sm">
              <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-violet-500 text-white">
                <Check className="h-3 w-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* CTA al formulario */}
        <div className="mx-auto mt-7 max-w-md">
          <a
            href="#solicitar"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(123,92,255,.35)]"
          >
            <Sparkles className="h-4 w-4" /> Pide tus press-on personalizadas
          </a>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="px-5 py-4">
        <div className="mx-auto max-w-md">
          <h2 className="text-center font-display text-2xl font-semibold text-ink-900">
            Cómo <em className="font-normal italic text-violet-500">funciona</em>
          </h2>
          <div className="mt-6 space-y-3">
            {PASOS.map((p) => (
              <div key={p.n} className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 font-display text-sm font-bold text-white">
                  {p.n}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold text-ink-900">{p.t}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-ink-500">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <Testimonials />

      {/* Formulario */}
      <section id="solicitar" className="scroll-mt-4 px-4 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
            Solicita tu kit
          </div>
          <h2 className="text-center font-display text-3xl font-semibold leading-tight text-ink-900">
            Pídelas <em className="font-normal italic text-violet-500">aquí</em>
          </h2>
          <div className="mx-auto mb-7 mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
          <PressOnFormCore />
        </div>
      </section>

      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
}
