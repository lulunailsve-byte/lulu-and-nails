import type { MetadataRoute } from "next";

// Genera /robots.txt automáticamente. Permite indexación total, apunta
// al sitemap. Si más adelante hay rutas privadas, se bloquean acá.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /btw es el panel admin (privado). /api endpoints no se indexan.
        disallow: ["/api/", "/btw"],
      },
    ],
    sitemap: "https://www.luluandnails.com/sitemap.xml",
    host: "https://www.luluandnails.com",
  };
}
