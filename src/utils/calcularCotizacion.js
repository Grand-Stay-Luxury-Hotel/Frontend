/**
 * calcularCotizacion — motor de precios para el cotizador de la Landing.
 *
 * Reglas de precio:
 *   Viernes (5) y Sábado (6) → precio_noche × 1.18
 *   Domingo (0)              → precio_noche × 1.10
 *   Resto de días            → precio_noche (base)
 *
 * IVA aplicado sobre el subtotal: 19 %
 *
 * @param {Object} params
 * @param {Object|null} params.roomData     Objeto completo del array ROOM
 * @param {string}      params.fechaEntrada 'YYYY-MM-DD'
 * @param {string}      params.fechaSalida  'YYYY-MM-DD'
 * @returns {Object|null}
 */
export function calcularCotizacion({ roomData, fechaEntrada, fechaSalida }) {
  if (!roomData || !fechaEntrada || !fechaSalida) return null;
  if (fechaSalida <= fechaEntrada) return null;

  const MS_POR_DIA = 86_400_000;
  const inicio     = new Date(fechaEntrada + "T12:00:00");
  const fin        = new Date(fechaSalida  + "T12:00:00");
  const noches     = Math.round((fin - inicio) / MS_POR_DIA);

  if (noches <= 0) return null;

  /** Precio de una noche dado el día de la semana */
  const precioNoche = (fecha) => {
    const dia = new Date(fecha + "T12:00:00").getDay();
    if (dia === 5 || dia === 6) return Math.round(roomData.precio_noche * 1.18);
    if (dia === 0)              return Math.round(roomData.precio_noche * 1.10);
    return roomData.precio_noche;
  };

  /** Desglose noche a noche */
  const desglose = Array.from({ length: noches }, (_, i) => {
    const d   = new Date(inicio.getTime() + i * MS_POR_DIA);
    const y   = d.getFullYear();
    const mm  = String(d.getMonth() + 1).padStart(2, "0");
    const dd  = String(d.getDate()).padStart(2, "0");
    const fecha  = `${y}-${mm}-${dd}`;
    const precio = precioNoche(fecha);
    const dia    = d.getDay();

    return {
      fecha,
      precio,
      esFinDeSemana: dia === 0 || dia === 5 || dia === 6,
    };
  });

  const subtotal = desglose.reduce((acc, n) => acc + n.precio, 0);
  const iva      = Math.round(subtotal * 0.19);
  const total    = subtotal + iva;

  /** Helpers de formato listos para la UI (sin el signo $) */
  const fmt = {
    precioPorNoche: roomData.precio_noche.toLocaleString("es-CO"),
    subtotal:       subtotal.toLocaleString("es-CO"),
    iva:            iva.toLocaleString("es-CO"),
    total:          total.toLocaleString("es-CO"),
  };

  return {
    room:     roomData,   // referencia completa a la habitación
    noches,
    desglose,             // [{ fecha, precio, esFinDeSemana }]
    subtotal,
    iva,
    total,
    fmt,
  };
}
