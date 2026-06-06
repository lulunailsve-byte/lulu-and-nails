import type { MetadataRoute } from "next";

// Genera /sitemap.xml automáticamente. Una sola página (home) por ahora;
// cuando se agreguen más rutas (ej. /galeria, /sobre-mi), incluirlas acá.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.luluandnails.com";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/press-on`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
