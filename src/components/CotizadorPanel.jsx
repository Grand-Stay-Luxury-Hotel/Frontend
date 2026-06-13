import "./CotizadorPanel.css";
import { formatDateShort } from "../utils/format.js";

/**
 * CotizadorPanel — desglose de cotización estimada.
 *
 * Aparece dentro del booking-widget cuando fechaEntrada,
 * fechaSalida y tipo de habitación están completos.
 *
 * Props:
 *   cotizacion   — objeto devuelto por calcularCotizacion()
 *   fechaEntrada — 'YYYY-MM-DD'
 *   fechaSalida  — 'YYYY-MM-DD'
 *   huespedes    — { adultos, ninos }
 *   onReservar   — () => void
 */
export default function CotizadorPanel({
  cotizacion,
  fechaEntrada,
  fechaSalida,
  huespedes,
  onReservar,
}) {
  const { room, noches, desglose, fmt } = cotizacion;
  const tieneFinDeSemana = desglose.some((n) => n.esFinDeSemana);
  const totalGuests  = huespedes.adultos + huespedes.ninos;
  const capacidadOk  = totalGuests <= room.capacidad;

  return (
    <div className="cotiz-panel">
      <p className="cotiz-eyebrow">✦ Cotización estimada</p>

      <div className="cotiz-grid">
        {/* Columna izquierda — info de la habitación */}
        <div className="cotiz-left">
          <img
            src={room.imagen_url_optimizada}
            alt={room.nombre}
            className="cotiz-thumb"
          />
          <p className="cotiz-room-name">{room.nombre}</p>
          <div className="cotiz-chips">
            <span className="cotiz-chip">
              {room.capacidad} huésped{room.capacidad !== 1 ? "es" : ""}
            </span>
            <span className="cotiz-chip">
              {room.camas} cama{room.camas !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="cotiz-dates">
            {formatDateShort(fechaEntrada)}
            <span className="cotiz-arrow"> → </span>
            {formatDateShort(fechaSalida)}
            <span className="cotiz-nights-badge">
              {noches} noche{noches !== 1 ? "s" : ""}
            </span>
          </p>
        </div>

        {/* Columna derecha — desglose de precios */}
        <div className="cotiz-right">
          <div className="cotiz-line">
            <span>Precio por noche</span>
            <span>${fmt.precioPorNoche}</span>
          </div>
          <div className="cotiz-line">
            <span>{noches} noche{noches !== 1 ? "s" : ""}{tieneFinDeSemana ? " *" : ""}</span>
            <span>${fmt.subtotal}</span>
          </div>
          <div className="cotiz-line cotiz-line--tax">
            <span>IVA (19%)</span>
            <span>${fmt.iva}</span>
          </div>
          <div className="cotiz-total-row">
            <span className="cotiz-total-label">Total estimado</span>
            <span className="cotiz-total-val">${fmt.total} COP</span>
          </div>
          {tieneFinDeSemana && (
            <p className="cotiz-fds-note">* Vie–Sáb +18% &middot; Dom +10%</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="cotiz-actions">
        <button
          type="button"
          className="btn btn-gold btn-full"
          onClick={onReservar}
          disabled={!capacidadOk}
        >
          Reservar Ahora
        </button>
        {!capacidadOk && (
          <p className="cotiz-cap-warn">
            Esta habitación admite máx. {room.capacidad} huésped{room.capacidad !== 1 ? "es" : ""}.
            Reducí el grupo o cambiá de tipo.
          </p>
        )}
        <p className="cotiz-disclaimer">
          Precio referencial en COP. Para confirmar la reserva necesitás
          iniciar sesión o crear una cuenta.
        </p>
      </div>
    </div>
  );
}
