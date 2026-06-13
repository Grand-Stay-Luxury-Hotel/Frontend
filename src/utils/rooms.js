/**
 * rooms.js — catálogo de tipos de habitación de Grand Stay.
 * Fuente única de verdad compartida por Landing, DisponibilidadPublica,
 * Reservas (dashboard) y cualquier otro componente que necesite el catálogo.
 */
export const ROOM = [
  {
    id: 1,
    nombre: "Estándar",
    descripcion:
      "Habitación moderna con cama cómoda, baño privado con amenidades premium y acceso a todas las facilidades del hotel.",
    descripcion_completa:
      "Nuestra habitación Estándar es el punto de partida perfecto para una estadía confortable. Diseñada con atención al detalle, cuenta con una cama de calidad superior, baño privado equipado con artículos de tocador de lujo, climatización individual y acceso a wifi de alta velocidad. Ideal para viajeros de negocios y turistas que buscan relación calidad-precio.",
    capacidad: 2,
    camas: 1,
    precio_base: 150000,
    precio_noche: 150000,
    temporada: "Media",
    ubicacion: {
      piso: "2-5",
      ala: "Ala Este",
      vista: "Parcial a la ciudad",
    },
    amenidades: [
      "WiFi gratis",
      'TV inteligente 43"',
      "Climatización individual",
      "Baño privado",
      "Toiletries de lujo",
      "Escritorio de trabajo",
    ],
    imagen_url:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=80",
    imagen_url_optimizada:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=80",
    badge: "Más solicitada",
    destacado: true,
  },
  {
    id: 2,
    nombre: "Deluxe",
    descripcion:
      "Suite moderna con estar independiente, cama king size y vistas panorámicas a la ciudad desde balcón privado.",
    descripcion_completa:
      "La suite Deluxe representa el equilibrio perfecto entre lujo y funcionalidad. Cuenta con un área de estar separada, cama king size de primera calidad, balcón privado con vistas panorámicas, baño con jacuzzi y ducha de efecto lluvia. Incluye minibar completamente surtido, servicio de concierge las 24 horas y acceso prioritario a todos nuestros servicios.",
    capacidad: 2,
    camas: 1,
    precio_base: 280000,
    precio_noche: 280000,
    temporada: "Alta",
    ubicacion: {
      piso: "6-15",
      ala: "Ala Oeste",
      vista: "Panorámica de la ciudad",
    },
    amenidades: [
      "Estar independiente",
      "Cama King Size",
      "Balcón privado",
      "Jacuzzi",
      "Ducha lluvia",
      "Minibar completo",
      "Servicio concierge 24/7",
      "Robes de seda",
    ],
    imagen_url:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    imagen_url_optimizada:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500&q=80",
    badge: null,
    destacado: false,
  },
  {
    id: 3,
    nombre: "Suite Junior",
    descripcion:
      "Suite elegante con dormitorio amplio, sala de estar espaciosa y baño de mármol con acabados premium.",
    descripcion_completa:
      "La Suite Junior ofrece una experiencia de lujo accesible con espacios generosos. Incluye dormitorio con cama queen, sala de estar con sofá, escritorio ejecutivo, baño de mármol con productos de baño personalizados y acceso prioritario a restaurante y spa. Perfecta para huéspedes que desean un poco más de espacio y privacidad sin llegar al nivel presidencial.",
    capacidad: 2,
    camas: 1,
    precio_base: 450000,
    precio_noche: 450000,
    temporada: "Media",
    ubicacion: {
      piso: "10-18",
      ala: "Ala Central",
      vista: "Vista a jardines y parcial ciudad",
    },
    amenidades: [
      "Dormitorio y sala separados",
      "Cama Queen Size",
      "Sofá de diseñador",
      "Baño mármol",
      "Ducha lluvia + tina",
      "Escritorio ejecutivo",
      "Productos de baño personalizados",
      "Ropa de cama de alta calidad",
    ],
    imagen_url:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    imagen_url_optimizada:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500&q=80",
    badge: null,
    destacado: false,
  },
  {
    id: 4,
    nombre: "Suite Senior",
    descripcion:
      "Suite de lujo con vista al atardecer, terraza privada, baño spa y acceso exclusivo a salones VIP.",
    descripcion_completa:
      "La Suite Senior es un oasis de tranquilidad con vistas espectaculares al atardecer. Caracterizada por su elegancia atemporal, incluye dormitorio premium con cama doble de lujo, terraza privada amueblada, baño spa con sauna integrada, sala de estar con vista, minibar de cortesía y servicio de butler personalizado. Acceso exclusivo a salones ejecutivos y privilegios especiales en todos nuestros servicios.",
    capacidad: 3,
    camas: 1,
    precio_base: 750000,
    precio_noche: 750000,
    temporada: "Alta",
    ubicacion: {
      piso: "16-20",
      ala: "Ala Premium",
      vista: "Atardecer y horizonte de la ciudad",
    },
    amenidades: [
      "Terraza privada",
      "Baño spa",
      "Sauna integrada",
      "Cama de lujo",
      "Minibar cortesía",
      "Butler personal",
      "Salón ejecutivo acceso",
      "Servicio de turndown nocturno",
    ],
    imagen_url:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    imagen_url_optimizada:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500&q=80",
    badge: null,
    destacado: false,
  },
  {
    id: 5,
    nombre: "Presidencial",
    descripcion:
      "Suite exclusiva de dos pisos con vista de 360°, servicios de mayordomía y acceso a áreas privadas del hotel.",
    descripcion_completa:
      "La Suite Presidencial es la máxima expresión del lujo en Grand Stay. Distribuida en dos niveles, cuenta con dormitorio principal y suite de huéspedes, sala de estar con vista de 360°, comedor privado, cocina completa, baño spa de mármol con jacuzzi, sauna y hamam. Servicio de mayordomía dedicado las 24 horas, chef privado disponible y acceso exclusivo a todas las facilidades. El epicentro del refinamiento absoluto.",
    capacidad: 4,
    camas: 2,
    precio_base: 2000000,
    precio_noche: 2000000,
    temporada: "Especial",
    ubicacion: {
      piso: "21 (Penthouse)",
      ala: "Única",
      vista: "360° panorámica completa",
    },
    amenidades: [
      "Dos pisos",
      "Dormitorio principal + suite huéspedes",
      "Sala de estar vista 360°",
      "Comedor privado",
      "Cocina completa",
      "Baño spa lujo",
      "Jacuzzi y sauna",
      "Mayordomía 24/7",
      "Chef privado",
      "Bar privado",
    ],
    imagen_url:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&q=80",
    imagen_url_optimizada:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&q=80",
    badge: "Exclusiva",
    destacado: false,
  },
];
