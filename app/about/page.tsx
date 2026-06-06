import type { Metadata } from "next";
import { loadAboutPhotos } from "@/lib/about-photos";
import { PressOnGalleryMarquee } from "@/components/pressonn/PressOnGalleryMarquee";
import { AboutStory } from "@/components/about/AboutStory";
import { AboutTestimonials } from "@/components/about/AboutTestimonials";
import { FooterSection } from "@/components/landing/FooterSection";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

const DESCRIPTION =
  "Conoce a Luizandra Zerpa, manicurista con más de 5 años de trayectoria y fundadora de Lulu & Nails. Su historia, su trabajo, su formación y lo que dicen sus clientas.";

export const metadata: Metadata = {
  title: "Sobre mí — Luizandra Zerpa | Lulu & Nails",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Sobre mí — Luizandra Zerpa | Lulu & Nails",
    description: DESCRIPTION,
    url: "/about",
    type: "profile",
    locale: "es_VE",
    images: ["/og-image.jpg"],
  },
};

const PARRAFOS = [
  "¡Hola! Soy Luizandra Zerpa, la mente y el corazón detrás de Lulu & Nails.",
  "Desde que era pequeña, mi mundo siempre estuvo lleno de pinceles, pinturas y caricaturas. Con los años, decidí llevar esa pasión a un lienzo totalmente diferente: las uñas. Fue así como descubrí que el arte en miniatura no solo era posible, sino que se convertiría en mi gran propósito.",
  "Llevo más de 5 años ejerciendo con orgullo como manicurista. En este camino, me enamoré por completo de este oficio, del aprendizaje constante y de las conexiones tan valiosas que se crean, tanto con mis colegas como con cada persona que se sienta en mi mesa.",
  "Este recorrido no ha sido rápido ni fácil, pero me ha enseñado que la paciencia y la dedicación valen la pena. Hoy miro atrás y me siento profundamente orgullosa de lo que he construido.",
];

function SectionHeader({ label, title, em }: { label: string; title: string; em: string }) {
  return (
    <div className="scroll-reveal text-center">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-violet-500">
        {label}
      </div>
      <h2 className="font-display text-3xl font-semibold leading-tight text-ink-900">
        {title} <em className="font-normal italic text-violet-500">{em}</em>
      </h2>
      <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-400" />
    </div>
  );
}

export default function AboutPage() {
  const { trabajo, clases, cursos, screenshots, historia } = loadAboutPhotos();

  // "Varias tiras" de slides para el trabajo.
  const mid = Math.ceil(trabajo.length / 2);
  const trabajoA = trabajo.slice(0, mid);
  const trabajoB = trabajo.slice(mid);

  return (
    <main className="bg-gradient-to-b from-violet-50 via-pink-50 to-warm-white">
      {/* Hero */}
      <section className="px-5 pb-12 pt-24">
        <div className="mx-auto max-w-md text-center">
          <span className="inline-block rounded-full bg-gradient-to-r from-violet-500 to-pink-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-white">
            Sobre mí
          </span>
          <h1 className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.1] text-ink-900">
            El arte detrás de <em className="font-normal italic text-violet-500">cada detalle</em>
          </h1>

          <div className="mt-5 space-y-4 text-left">
            {PARRAFOS.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-ink-600">
                {p}
              </p>
            ))}
            <p className="pt-1 text-center font-script text-2xl text-violet-700">
              ¡Bienvenida a mi espacio creativo! 💜
            </p>
            <p className="text-center font-script text-3xl text-ink-900">— Luizandra Zerpa</p>
          </div>
        </div>
      </section>

      {/* Mi historia */}
      {historia.length > 0 && (
        <section className="px-5 py-14">
          <div className="mx-auto mb-8 max-w-md">
            <SectionHeader label="Mi recorrido" title="Mi" em="historia" />
            <p className="mt-4 text-center text-sm leading-relaxed text-ink-500">
              Cada espacio, cada herramienta y cada esmalte cuentan una parte de este camino.
            </p>
          </div>
          <AboutStory items={historia} />
        </section>
      )}

      {/* Mi trabajo y ocasiones especiales */}
      {trabajo.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-md px-5">
            <SectionHeader label="Mi arte" title="Mi trabajo y" em="ocasiones especiales" />
          </div>
          <div className="mx-auto max-w-md px-5">
            <PressOnGalleryMarquee images={trabajoA} />
            {trabajoB.length > 0 && <PressOnGalleryMarquee images={trabajoB} reverse />}
          </div>
        </section>
      )}

      {/* Formación y enseñanza */}
      {(clases.length > 0 || cursos.length > 0) && (
        <section className="py-14">
          <div className="mx-auto max-w-md px-5">
            <SectionHeader label="Crecimiento" title="Formación y" em="enseñanza" />
          </div>
          <div className="mx-auto max-w-md px-5">
            {clases.length > 0 && (
              <>
                <h3 className="mt-7 text-[11px] font-bold uppercase tracking-[.12em] text-violet-500">
                  Clases que doy
                </h3>
                <PressOnGalleryMarquee images={clases} />
              </>
            )}
            {cursos.length > 0 && (
              <>
                <h3 className="mt-7 text-[11px] font-bold uppercase tracking-[.12em] text-violet-500">
                  Cursos y certificaciones
                </h3>
                <PressOnGalleryMarquee images={cursos} reverse />
              </>
            )}
          </div>
        </section>
      )}

      {/* Testimonios */}
      <AboutTestimonials screenshots={screenshots} />

      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
}
