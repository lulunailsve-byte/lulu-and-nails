import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollReveal } from "@/components/ScrollReveal";

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

export const metadata: Metadata = {
  title: "Lulu & Nails · Renace tu look",
  description:
    "Estudio de uñas profesional de Luizandra Zerpa. Reserva tu cita en minutos.",
  applicationName: "Lulu & Nails",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lulu & Nails",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Lulu & Nails · Renace tu look",
    description: "Reserva tu cita en minutos. Manicura, pedicure y diseños.",
    type: "website",
    locale: "es_VE",
  },
};

export const viewport: Viewport = {
  themeColor: "#7B5CFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      </body>
    </html>
  );
}
