// Catálogo único de servicios. Fuente de verdad para landing + reserva + API.

export type Service = {
  id: string;
  emoji: string;          // fallback / accent (no es la visual principal)
  icon: string;           // path absoluto al SVG en /public/services-icons/
  name: string;
  duration: number;       // minutos
  price: number;          // USD
  description: string;
  popular?: boolean;
  premium?: boolean;
  color: "violet" | "pink";
};

export const SERVICES: Service[] = [
  {
    id: "manicura-tradicional",
    emoji: "✨",
    icon: "/services-icons/tradicional.svg",
    name: "Manicura Tradicional",
    duration: 90,
    price: 14,
    description:
      "Esmaltado clásico sobre la uña natural. Incluye una limpieza profunda de cutículas (manicura) para un acabado limpio y prolijo.",
    color: "violet",
  },
  {
    id: "manicura-semipermanente",
    emoji: "💜",
    icon: "/services-icons/semipermanente.svg",
    name: "Manicura Semipermanente",
    duration: 90,
    price: 15,
    description:
      "Esmaltado de alta durabilidad sobre uña natural, secado en cabina. Disfruta de un color impecable y con brillo por aproximadamente 28 días.",
    color: "violet",
  },
  {
    id: "nivelacion",
    emoji: "🔮",
    icon: "/services-icons/nivelacion.svg",
    name: "Nivelación",
    duration: 120,
    price: 18,
    description:
      "Corrección de imperfecciones en la uña natural mediante un recubrimiento flexible que aporta fuerza y uniformidad. Ideal para uñas cortas. Duración: ~28 días.",
    color: "pink",
  },
  {
    id: "capping-polygel",
    emoji: "💎",
    icon: "/services-icons/capping-polygel.svg",
    name: "Capping de Polygel",
    duration: 120,
    price: 20,
    description:
      "Capa protectora de Polygel sobre la uña natural para aportarle resistencia extrema y evitar quiebres. Recomendado tanto para uñas cortas como largas. Duración: ~28 días.",
    popular: true,
    color: "violet",
  },
  {
    id: "sistema-jelly",
    emoji: "🫧",
    icon: "/services-icons/sistema-jelly.svg",
    name: "Sistema Soft Gel / Jelly",
    duration: 120,
    price: 18,
    description:
      "Tips de gel flexible que se adaptan y se adhieren perfectamente a tu uña natural. El resultado es una extensión ligera, muy flexible y con un aspecto súper natural. Duración: ~28 días.",
    color: "pink",
  },
  {
    id: "esculpido-polygel",
    emoji: "👑",
    icon: "/services-icons/esculpido-polygel.svg",
    name: "Esculpido en Polygel",
    duration: 160,
    price: 22,
    description:
      "Extensiones artesanales construidas desde cero con Polygel. El servicio ideal si buscas diseñar el largo y la forma de tus sueños, aumentando el crecimiento visual de tus uñas.",
    popular: true,
    premium: true,
    color: "violet",
  },
  {
    id: "retiro-servicio",
    emoji: "🧹",
    icon: "/services-icons/retiro-polygel.svg",
    name: "Retiro de Servicio",
    duration: 30,
    price: 3,
    description:
      "Remoción profesional de tu sistema actual (semipermanente, polygel o sistema jelly). Ideal si vienes de otro salón o quieres cambiar de servicio.",
    color: "pink",
  },
];

export const PEDICURE = {
  id: "pedicure-semipermanente",
  emoji: "🦶",
  icon: "/services-icons/pedicura.svg",
  name: "Pedicura",
  duration: 60,
  price: 15,
  description:
    "Limpieza y estética del pie que incluye exfoliación profunda e hidratación de la piel. Puedes elegir tu acabado entre esmaltado tradicional o semipermanente (por favor, especificar al agendar).",
  color: "pink" as const,
};

// Nota aplicable a TODOS los retiros: si el trabajo es de Lulu, el retiro va
// incluido en el mantenimiento. Los precios aplican solo para trabajos
// hechos en otro salón o cambios drásticos de sistema.
export const RETIROS_NOTA =
  "Los retiros de productos aplicados en nuestro salón suelen estar incluidos en tu mantenimiento. Los siguientes costos aplican para trabajos de otro salón o cambios drásticos de sistema.";

export const RETIROS = [
  {
    id: "retiro-semi",
    emoji: "🔄",
    icon: "/services-icons/retiro-semi.svg",
    name: "Retiro Semipermanente",
    price: 3,
    description: "Remoción segura del esmalte (aplica si el servicio fue realizado en otro salón).",
  },
  {
    id: "retiro-polygel",
    emoji: "🧹",
    icon: "/services-icons/retiro-polygel.svg",
    name: "Retiro de Polygel o Sistema Jelly",
    price: 6,
    description: "Remoción completa del sistema. Aplica si el trabajo es de otro salón o si deseas cambiar a un servicio diferente.",
  },
  {
    id: "restauracion",
    emoji: "🛠️",
    icon: "/services-icons/restauracion.svg",
    name: "Restauración de Uña",
    price: 1,
    description: "Reparación individual de una uña rota o dañada para devolverle su estética y fuerza.",
  },
];

export function findService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
