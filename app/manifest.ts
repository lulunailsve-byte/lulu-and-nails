import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lulu & Nails",
    short_name: "Lulu & Nails",
    description:
      "Estudio de uñas de Luizandra Zerpa — reserva tu cita en minutos.",
    start_url: "/",
    // Android: 'fullscreen' oculta el status bar (hora/batería) y la nav bar
    // para que la PWA sea totalmente edge-to-edge — como app nativa inmersiva.
    // display_override es lo moderno; display:'standalone' queda como fallback
    // si el browser no soporta override.
    // iOS Safari ignora estos campos — su edge-to-edge se maneja con el meta
    // apple-mobile-web-app-status-bar-style:'black-translucent' (que tenemos).
    display: "standalone",
    display_override: ["fullscreen", "standalone"],
    background_color: "#FEFCFA",
    theme_color: "#7B5CFF",
    orientation: "portrait",
    lang: "es-VE",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
