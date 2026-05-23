// Catálogo único de servicios. Fuente de verdad para landing + reserva + API.

export type Service = {
  id: string;
  emoji: string;
  name: string;
  duration: number;     // minutos
  price: number;        // USD
  description: string;
  popular?: boolean;
  premium?: boolean;
  color: "violet" | "pink";
};

export const SERVICES: Service[] = [
  {
    id: "manicura-tradicional",
    emoji: "✨",
    name: "Manicura Tradicional",
    duration: 90,
    price: 14,
    description:
      "Limpieza completa, forma, cutículas y esmalte tradicional de larga duración.",
    color: "violet",
  },
  {
    id: "manicura-semipermanente",
    emoji: "💜",
    name: "Manicura Semipermanente",
    duration: 90,
    price: 15,
    description:
      "Esmalte gel de larga duración que no se astilla. Brillo perfecto por semanas.",
    popular: true,
    color: "violet",
  },
  {
    id: "nivelacion",
    emoji: "🔮",
    name: "Nivelación",
    duration: 120,
    price: 18,
    description:
      "Rebalanceo profesional del crecimiento para mantener tus extensiones perfectas.",
    color: "pink",
  },
  {
    id: "capping-polygel",
    emoji: "💎",
    name: "Capping de Polygel",
    duration: 120,
    price: 20,
    description:
      "Refuerzo de uñas naturales con polygel para mayor dureza y protección.",
    color: "violet",
  },
  {
    id: "sistema-jelly",
    emoji: "🫧",
    name: "Sistema Jelly",
    duration: 120,
    price: 18,
    description:
      "Extensión con efecto transparente y textura suave. Naturalidad con elegancia.",
    color: "pink",
  },
  {
    id: "esculpido-polygel",
    emoji: "👑",
    name: "Esculpido en Polygel",
    duration: 160,
    price: 22,
    description:
      "El servicio más completo. Extensiones esculpidas a mano con polygel premium.",
    popular: true,
    premium: true,
    color: "violet",
  },
];

export const PEDICURE = {
  id: "pedicure-semipermanente",
  emoji: "🦶",
  name: "Pedicure Semipermanente",
  duration: 60,
  price: 15,
  description:
    "Cuidado completo del pie con esmalte semipermanente de larga duración.",
  color: "pink" as const,
};

export const RETIROS = [
  { id: "retiro-semi", emoji: "🔄", name: "Retiro de Semipermanente", price: 3, description: "Retiro seguro de semipermanente colocado en otro lugar." },
  { id: "retiro-polygel", emoji: "🧹", name: "Retiro de Polygel / Jelly", price: 6, description: "Retiro profesional y seguro de polygel o sistema jelly." },
  { id: "restauracion", emoji: "🛠️", name: "Restauraciones", price: 1, description: "Reparación de uñas rotas o dañadas. Precio según el caso." },
];

export function findService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
