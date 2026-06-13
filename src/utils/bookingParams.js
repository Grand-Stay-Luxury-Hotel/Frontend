/**
 * bookingParams.js — utilidades para serializar/deserializar los parámetros
 * del cotizador a query strings, así viajan limpios entre Landing, login
 * y el dashboard.
 */

/**
 * Construye un URLSearchParams desde un objeto de booking + huéspedes.
 *
 * @param {Object} payload
 * @param {string} [payload.fechaEntrada]
 * @param {string} [payload.fechaSalida]
 * @param {string} [payload.tipo]
 * @param {number} [payload.adultos]
 * @param {number} [payload.ninos]
 * @returns {URLSearchParams}
 */
export function buildBookingParams({ fechaEntrada, fechaSalida, tipo, adultos, ninos }) {
  const params = new URLSearchParams();
  if (fechaEntrada) params.set("fechaEntrada", fechaEntrada);
  if (fechaSalida)  params.set("fechaSalida",  fechaSalida);
  if (tipo)         params.set("tipo",         tipo);
  if (adultos !== undefined && adultos !== null) {
    params.set("adultos", String(adultos));
  }
  if (ninos && ninos > 0) {
    params.set("ninos", String(ninos));
  }
  return params;
}

/**
 * Lee parámetros de booking desde un URLSearchParams (los que devuelve
 * useSearchParams). Provee defaults sensatos.
 *
 * @param {URLSearchParams} searchParams
 */
export function readBookingParams(searchParams) {
  return {
    fechaEntrada: searchParams.get("fechaEntrada") || "",
    fechaSalida:  searchParams.get("fechaSalida")  || "",
    tipo:         searchParams.get("tipo")         || "",
    adultos:      parseInt(searchParams.get("adultos") || "2", 10),
    ninos:        parseInt(searchParams.get("ninos")   || "0", 10),
  };
}
