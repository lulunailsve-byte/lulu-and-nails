// Datos de marca centralizados (WhatsApp, redes, copy clave).

export const BRAND = {
  name: "Lulu & Nails",
  owner: "Luizandra Zerpa",
  tagline: "Renace tu look",
  location: "Venezuela",
  waNumber: "584143441103",     // sin "+" para wa.me
  waDisplay: "+58 414-3441103",
  instagram: "luluandnails.ve",
  tiktok: "_lulunails",
  hours: "Lun – Sáb · 9am-6pm",
} as const;

export const waLink = (text?: string) => {
  const base = `https://wa.me/${BRAND.waNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
