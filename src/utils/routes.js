/**
 * routes.js — fuente única de verdad para las rutas del frontend.
 * Si una ruta cambia, se actualiza acá y se refleja en todo el proyecto.
 */
export const ROUTES = Object.freeze({
  /* ─── Públicas ─── */
  HOME:                 "/",
  LOGIN:                "/login",
  REGISTRO:             "/registro",
  HABITACIONES_PUBLICA: "/disponibilidad", // ruta pública de catálogo

  /* ─── Dashboard (autenticado) ─── */
  DASHBOARD:               "/dashboard",
  DASHBOARD_DISPONIBILIDAD:"/dashboard/disponibilidad",
  DASHBOARD_RESERVAS:      "/dashboard/reservas",
  DASHBOARD_HABITACIONES:  "/dashboard/habitaciones",
  DASHBOARD_CHECKIN:       "/dashboard/checkin",
  DASHBOARD_CHECKOUT:      "/dashboard/checkout",
  DASHBOARD_CONSUMOS:      "/dashboard/consumos",
  DASHBOARD_TARIFAS:       "/dashboard/tarifas",
  DASHBOARD_INVENTARIO:    "/dashboard/inventario",
  DASHBOARD_REPORTES:      "/dashboard/reportes",
  DASHBOARD_AUDITORIA:     "/dashboard/auditoria",
  DASHBOARD_CUENTA:        "/dashboard/cuenta",
});

/**
 * Construye un path con query params. Útil para redirects con datos.
 *
 * @example
 *   withParams(ROUTES.LOGIN, { redirect: ROUTES.DASHBOARD_RESERVAS, tipo: 'Deluxe' })
 *   //   → "/login?redirect=%2Fdashboard%2Freservas&tipo=Deluxe"
 */
export function withParams(route, params = {}) {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (filtered.length === 0) return route;
  const qs = new URLSearchParams(filtered).toString();
  return `${route}?${qs}`;
}
