/**
 * estados.js — catálogo único de estados del sistema.
 *
 * Dos dominios separados:
 *   ESTADOS_HABITACION — disponible/ocupada/limpieza/mantenimiento/bloqueada
 *   ESTADOS_RESERVA    — pendiente/confirmada/en_curso/completada/cancelada/checkin/checkout
 *
 * Cada estado tiene: value, label (es-CO), badge (clase CSS).
 */

export const ESTADOS_HABITACION = Object.freeze([
  { value: 'disponible',    label: 'Disponible',    badge: 'badge-success' },
  { value: 'ocupada',       label: 'Ocupada',       badge: 'badge-error'   },
  { value: 'limpieza',      label: 'Limpieza',      badge: 'badge-warning' },
  { value: 'mantenimiento', label: 'Mantenimiento', badge: 'badge-info'    },
  { value: 'bloqueada',     label: 'Bloqueada',     badge: 'badge-gold'    },
]);

export const ESTADOS_RESERVA = Object.freeze([
  { value: 'pendiente',  label: 'Pendiente',  badge: 'badge-warning' },
  { value: 'confirmada', label: 'Confirmada', badge: 'badge-info'    },
  { value: 'en_curso',   label: 'En curso',   badge: 'badge-success' },
  { value: 'completada', label: 'Completada', badge: 'badge-info'    },
  { value: 'cancelada',  label: 'Cancelada',  badge: 'badge-error'   },
  { value: 'checkin',    label: 'Check-In',   badge: 'badge-gold'    },
  { value: 'checkout',   label: 'Check-Out',  badge: 'badge-info'    },
]);

/* ─── Lookups derivados ─────────────────────────────────────── */

const buildLookup = (arr) => Object.freeze(
  Object.fromEntries(arr.map((e) => [e.value, e]))
);

export const HABITACION_BY_VALUE = buildLookup(ESTADOS_HABITACION);
export const RESERVA_BY_VALUE    = buildLookup(ESTADOS_RESERVA);

/* ─── Helpers ───────────────────────────────────────────────── */

/** Devuelve la clase de badge para un estado de habitación, con fallback. */
export function badgeHabitacion(value) {
  return HABITACION_BY_VALUE[value]?.badge ?? 'badge-info';
}

/** Devuelve la clase de badge para un estado de reserva, con fallback. */
export function badgeReserva(value) {
  return RESERVA_BY_VALUE[value]?.badge ?? 'badge-info';
}

/** Devuelve el label legible de un estado de habitación. */
export function labelHabitacion(value) {
  return HABITACION_BY_VALUE[value]?.label ?? value;
}

/** Devuelve el label legible de un estado de reserva. */
export function labelReserva(value) {
  return RESERVA_BY_VALUE[value]?.label ?? value;
}

/** Estados de reserva que se consideran activos (filtrables como "vigentes"). */
export const ESTADOS_RESERVA_ACTIVOS = Object.freeze([
  'pendiente', 'confirmada', 'en_curso',
]);
