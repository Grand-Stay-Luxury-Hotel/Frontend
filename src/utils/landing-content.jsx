/**
 * landing-content.js — datos estáticos de la página Landing.
 * Centralizado para mantener la presentación separada del contenido.
 */
import { IconSpa, IconDining, IconCar, IconConcierge } from "../components/icons/index.jsx";

export const TESTIMONIALS = [
  {
    quote:
      "Una experiencia que redefine el significado del lujo. Cada detalle fue cuidado con una atención que pocas veces he visto en mis 20 años de viajes de negocios.",
    name: "Carlos Mendoza",
    platform: "Booking.com - 5 estrellas",
    avatar: "https://i.pravatar.cc/80?img=12",
  },
  {
    quote:
      "La suite presidencial superó todas mis expectativas. El personal anticipaba cada necesidad antes de expresarla. Volveré sin dudarlo.",
    name: "Sofia Hartmann",
    platform: "TripAdvisor - 5 estrellas",
    avatar: "https://i.pravatar.cc/80?img=47",
  },
  {
    quote:
      "Pasé mi luna de miel en Grand Stay y fue mágico. El spa, el restaurante, la vista... todo perfectamente orquestado.",
    name: "Alejandro & Valeria",
    platform: "Google Reviews - 5 estrellas",
    avatar: "https://i.pravatar.cc/80?img=23",
  },
];

export const AMENITIES = [
  {
    iconKey: "spa",
    title: "Spa & Wellness",
    desc: "Tratamientos exclusivos, sauna finlandesa y piscina de hidromasaje con agua termal.",
  },
  {
    iconKey: "dining",
    title: "Alta Gastronomía",
    desc: "Restaurante con chef galardonado. Cocina de autor con ingredientes de temporada.",
  },
  {
    iconKey: "car",
    title: "Traslado Privado",
    desc: "Flota de vehículos de lujo disponibles al aeropuerto y destinos locales.",
  },
  {
    iconKey: "concierge",
    title: "Concierge 24/7",
    desc: "Reservas, recomendaciones y atención personalizada en cualquier momento.",
  },
];

/** Resuelve la iconKey a su componente — útil para renderizar AMENITIES */
export function getAmenityIcon(iconKey) {
  switch (iconKey) {
    case "spa":       return <IconSpa />;
    case "dining":    return <IconDining />;
    case "car":       return <IconCar />;
    case "concierge": return <IconConcierge />;
    default:          return null;
  }
}
