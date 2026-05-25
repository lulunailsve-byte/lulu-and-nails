import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BRAND, waLink } from "@/lib/brand";

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

// Descripción usada en title bar, OG, Twitter, search results.
// Construida para incluir keywords orgánicas sin sonar a spam.
const SITE_DESCRIPTION =
  "Estudio profesional de uñas en Venezuela por Luizandra Zerpa. Manicura semipermanente, polygel, esculpido, pedicura y diseños personalizados. Reserva tu cita online en menos de un minuto.";

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
    statusBarStyle: "default",
    title: BRAND.name,
  },
  formatDetection: { telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Lulu & Nails · Renace tu look",
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
        alt: `${BRAND.name} — estudio de uñas profesional`,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lulu & Nails · Renace tu look",
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
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Manicura Tradicional" }, price: "14", priceCurrency: "USD" },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Manicura Semipermanente" }, price: "15", priceCurrency: "USD" },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Nivelación" }, price: "18", priceCurrency: "USD" },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Capping de Polygel" }, price: "20", priceCurrency: "USD" },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sistema Soft Gel / Jelly" }, price: "18", priceCurrency: "USD" },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Esculpido en Polygel" }, price: "22", priceCurrency: "USD" },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Pedicura" }, price: "15", priceCurrency: "USD" },
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
