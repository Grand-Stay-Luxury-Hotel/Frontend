/**
 * format.js — utilidades de formato para fechas y moneda (es-CO).
 * Centraliza la lógica que aparecía duplicada en Landing, CotizadorPanel,
 * DisponibilidadPublica y otros componentes.
 */

export const MONTHS_ES = [
  "ene","feb","mar","abr","may","jun",
  "jul","ago","sep","oct","nov","dic",
];

export const MONTHS_ES_FULL = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

/**
 * Formatea un número como moneda colombiana sin decimales.
 *   formatCOP(1500000) → "$1.500.000"
 */
export function formatCOP(value) {
  if (value === null || value === undefined || isNaN(value)) return "$0";
  return "$" + Math.round(Number(value)).toLocaleString("es-CO");
}

/**
 * Formato corto: '11 jun'. Acepta string ISO 'YYYY-MM-DD',
 * ISO completo 'YYYY-MM-DDTHH:mm:ss', o cualquier formato que
 * el constructor Date de JS sepa parsear.
 */
export function formatDateShort(value) {
  if (!value) return "—";
  // Si es string, tomamos solo la parte de fecha antes de la 'T'
  const clean = typeof value === "string" ? value.split("T")[0] : value;
  // Intentamos parsear como YYYY-MM-DD (evita problemas de zona horaria)
  if (typeof clean === "string" && /^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [, m, d] = clean.split("-").map(Number);
    return `${d} ${MONTHS_ES[m - 1]}`;
  }
  // Fallback: dejamos que Date lo parsee (formatos no estándar del backend)
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

/**
 * Formato largo: '11 de junio de 2026'.
 * Mismo tratamiento robusto que formatDateShort.
 */
export function formatDateLong(value) {
  if (!value) return "—";
  const clean = typeof value === "string" ? value.split("T")[0] : value;
  if (typeof clean === "string" && /^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split("-").map(Number);
    return `${d} de ${MONTHS_ES_FULL[m - 1]} de ${y}`;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return `${date.getDate()} de ${MONTHS_ES_FULL[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Calcula el número de noches entre dos fechas ISO. 0 si inválido.
 */
export function calcularNoches(fechaEntrada, fechaSalida) {
  if (!fechaEntrada || !fechaSalida || fechaSalida <= fechaEntrada) return 0;
  const ms =
    new Date(fechaSalida  + "T12:00:00") -
    new Date(fechaEntrada + "T12:00:00");
  return Math.round(ms / 86_400_000);
}

/**
 * Pluraliza correctamente "n huéspedes" / "n noches" / etc.
 *   pluralizar(1, 'cama')  → "1 cama"
 *   pluralizar(3, 'noche') → "3 noches"
 */
export function pluralizar(count, singular, plural) {
  const p = plural ?? (singular.endsWith("s") ? singular : singular + "s");
  return `${count} ${count === 1 ? singular : p}`;
}
