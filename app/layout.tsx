import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BRAND, waLink } from "@/lib/brand";
import { SERVICES, PEDICURE } from "@/lib/services";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

// Descripción optimizada (~152 chars — dentro del óptimo 110-160 que validan
// OG/Twitter/Google). Incluye ubicación, dueña, servicios, kits press-on y CTA.
const SITE_DESCRIPTION =
  "Uñas en Venezuela por Luizandra Zerpa: manicura semipermanente, polygel, esculpido, pedicura y kits press-on personalizados con envío nacional. Reserva online.";

// Title más largo para redes sociales (~50 chars — dentro del óptimo 50-60
// que pide OG). El <title> de la página y la pestaña del browser usan el
// título corto preferido por la dueña.
const OG_TITLE = "Lulu & Nails — Uñas y kits press-on en Venezuela";

const SITE_URL = "https://www.luluandnails.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Lulu & Nails · Renace tu look",
  description: SITE_DESCRIPTION,
  // Keywords: marca + sinónimos + servicios + intención de búsqueda + ubicación.
  // Google ya no usa <meta keywords> directamente para ranking pero algunos otros
  // motores y bots (Bing, DuckDuckGo, IA crawlers) sí lo leen.
  keywords: [
    // Brand
    "Lulu & Nails", "Lulu Nails", "Lulu and Nails", "luluandnails",
    "Luizandra Zerpa",
    // Categoría + ubicación
    "estudio de uñas Venezuela", "salón de uñas Venezuela", "manicurista Venezuela",
    "nail salon Venezuela", "uñas profesionales Venezuela",
    // Servicios principales
    "manicura", "manicura tradicional", "manicura semipermanente",
    "esmaltado semipermanente", "esmaltado gel",
    "pedicura", "pedicura semipermanente",
    "polygel", "capping polygel", "esculpido en polygel",
    "sistema jelly", "soft gel", "nivelación de uñas",
    "uñas de gel", "uñas acrílicas", "uñas postizas",
    // Press-On (kits personalizados a domicilio)
    "press on", "press-on", "presson", "preson",
    "press on nails", "press on uñas", "uñas press", "uñas press on", "uñas presson",
    "uñas postizas press on", "uñas de quita y pon",
    "press on Venezuela", "press-on Venezuela", "presson Venezuela",
    "press on uñas Venezuela", "nails press on Venezuela", "nails presson Venezuela",
    "kit press on", "kit de uñas", "kit de uñas press on",
    "kit press on personalizado", "kit press on Venezuela",
    "uñas personalizadas", "uñas a tu medida", "uñas a la medida",
    "diseño de uñas personalizado", "diseño de uñas a medida",
    "uñas fáciles en casa", "uñas fáciles en casa Venezuela",
    "uñas en casa", "uñas hechas en casa", "uñas para poner en casa",
    "uñas do it yourself", "uñas DIY", "uñas reutilizables", "uñas adhesivas",
    "uñas listas para usar", "uñas en minutos", "uñas express",
    "manicura en casa", "manicura express",
    "uñas que duren 15 días", "uñas en casa que duren 15 días",
    "uñas duraderas", "uñas que duran semanas",
    "uñas para eventos", "uñas para eventos importantes", "uñas para eventos personalizados",
    "uñas para fiestas", "uñas para bodas", "uñas para quinceañeras", "uñas para graduación",
    "uñas con envío", "uñas con envío nacional", "envío de uñas Venezuela",
    "comprar uñas press on", "comprar press on Venezuela",
    "soft gel press on", "uñas soft gel",
    // Local (Aragua)
    "uñas Cagua", "uñas Turmero", "uñas Maracay", "uñas Aragua",
    "press on Cagua", "press on Turmero", "press on Maracay", "press on Aragua",
    // Intención de búsqueda
    "reservar manicura online", "agendar cita uñas", "agendar manicura",
    "cita uñas Venezuela", "manicura cerca de mí",
    // Otros
    "diseño de uñas", "decoración de uñas", "nail art",
    "renace tu look",
  ],
  applicationName: BRAND.name,
  authors: [{ name: BRAND.owner }],
  creator: BRAND.owner,
  publisher: BRAND.name,
  category: "beauty",
  appleWebApp: {
    capable: true,
    // black-translucent: en iOS PWA el contenido va EDGE-TO-EDGE detrás del
    // status bar (con iconos blancos sobre el contenido). En globals.css hay
    // un gradient negro suave que solo aparece en display:standalone para que
    // los iconos sigan siendo legibles sobre el video del Hero.
    statusBarStyle: "black-translucent",
    title: BRAND.name,
  },
  formatDetection: { telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: OG_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: BRAND.name,
    type: "website",
    locale: "es_VE",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — Renace tu look. Uñas y kits press-on personalizados en Venezuela.`,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#7B5CFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// JSON-LD structured data — ayuda a Google a entender que esto es un
// BeautySalon, mostrar info enriquecida (horarios, redes, teléfono) en
// resultados de búsqueda y Knowledge Panel.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "@id": SITE_URL + "#business",
  name: BRAND.name,
  alternateName: ["Lulu Nails", "Lulu and Nails"],
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: SITE_URL + "/og-image.jpg",
  logo: SITE_URL + "/logo-horizontal.png",
  telephone: "+" + BRAND.waNumber,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressCountry: "VE",
  },
  founder: {
    "@type": "Person",
    name: BRAND.owner,
  },
  sameAs: [
    `https://www.instagram.com/${BRAND.instagram}`,
    `https://www.tiktok.com/@${BRAND.tiktok}`,
    waLink(),
  ],
  // Horarios: Lun-Sáb 9am-9pm con descanso 12-2pm — se modela como dos slots.
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "12:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "14:00",
      closes: "21:00",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Servicios de uñas",
    // Itera SERVICES + PEDICURE para que el catálogo SEO siempre refleje
    // el catálogo real del sitio (única fuente de verdad: lib/services.ts).
    itemListElement: [
      ...SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name },
        price: String(s.price),
        priceCurrency: "USD",
      })),
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: PEDICURE.name },
        price: String(PEDICURE.price),
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Kit Press-On personalizado",
          description:
            "Uñas press-on hechas a tu medida y diseño, listas para poner en casa. Duraderas, reutilizables y perfectas para eventos. Entrega personal en Cagua/Turmero o envío nacional.",
        },
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${jakarta.variable} ${caveat.variable}`}
    >
      {/* bg-violet-50 cubre el rubber-band en iOS/Safari para que no se vea blanco
          al hacer overscroll en el top. El gradient real va en <main> abajo. */}
      <body className="bg-violet-50">
        <SmoothScroll />
        <ScrollReveal />
        {children}
        {/* JSON-LD structured data para SEO enriquecido en Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
