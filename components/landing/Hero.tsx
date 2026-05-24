import Image from "next/image";
import { Sparkles, ArrowDown } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-pink-50 to-warm-white pb-12 pt-16">
      {/* Orbes decorativos */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-300 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-pink-300 opacity-25 blur-3xl" />

      <div className="relative mx-auto max-w-md px-5 text-center">
        <div className="fade-up inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Estudio de uñas profesional
        </div>

        {/* H1 oculto para SEO/a11y — la imagen del logo lo reemplaza visualmente */}
        <h1 className="sr-only">
          {BRAND.name} — {BRAND.tagline}
        </h1>

        {/* Logo horizontal — solo el lockup "Lulu & nails", tagline va abajo */}
        <div
          className="fade-up mx-auto mt-6 w-72 sm:w-80"
          style={{ animationDelay: ".05s" }}
        >
          <Image
            src="/logo-horizontal.png"
            alt={BRAND.name}
            width={4052}
            height={1323}
            priority
            className="h-auto w-full"
          />
        </div>

        <p
          className="fade-up mt-2 font-script text-3xl text-violet-500"
          style={{ animationDelay: ".1s" }}
        >
          {BRAND.tagline}
        </p>

        <p
          className="fade-up mt-1 text-sm italic text-ink-500"
          style={{ animationDelay: ".15s" }}
        >
          por {BRAND.owner}
        </p>

        <p
          className="fade-up mx-auto mt-6 max-w-xs text-base text-ink-700"
          style={{ animationDelay: ".2s" }}
        >
          Reserva tu cita en menos de un minuto.
          Sin llamadas, sin esperar respuesta.
        </p>

        <a
          href="#reservar"
          className="fade-up mt-7 inline-flex items-center gap-2 text-sm font-semibold text-violet-700"
          style={{ animationDelay: ".25s" }}
        >
          <ArrowDown className="h-4 w-4 animate-bounce" />
          Reserva aquí abajo
        </a>
      </div>
    </section>
  );
}
