// Utility: client-side cancellation penalty preview
export function calcularPenalizacion(fechaEntrada, montoPagado, fechaActual = new Date()) {
  const entrada = new Date(`${fechaEntrada}T00:00:00Z`);
  const actual  = new Date(Date.UTC(fechaActual.getUTCFullYear(), fechaActual.getUTCMonth(), fechaActual.getUTCDate()));
  const dias    = Math.ceil((entrada - actual) / (1000 * 60 * 60 * 24));

  let porcentaje = 100;
  if (dias > 7)               porcentaje = 0;
  else if (dias >= 3)         porcentaje = 30;
  else if (dias > 0)          porcentaje = 50;

  const montoPenalizacion = Number(((montoPagado * porcentaje) / 100).toFixed(2));
  const montoReembolso    = Number((montoPagado - montoPenalizacion).toFixed(2));
  return { porcentaje, montoPenalizacion, montoReembolso, dias };
}
