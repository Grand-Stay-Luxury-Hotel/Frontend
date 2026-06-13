import { useEffect } from "react";

/**
 * RoomModal — modal de detalle de habitación (vista pública en Landing).
 *
 * Props:
 *   room       — objeto del array ROOM
 *   onClose    — () => void
 *   onReservar — (nombreTipo) => void   callback que abre el flujo de reserva
 */
export default function RoomModal({ room, onClose, onReservar }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-gold-border)",
          borderRadius: "var(--r-lg)",
          maxWidth: 700,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen Header */}
        <div style={{ position: "relative" }}>
          <img
            src={room.imagen_url}
            alt={room.nombre}
            style={{ width: "100%", height: 280, objectFit: "cover" }}
          />
          {room.badge && (
            <span
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "var(--c-gold)",
                color: "var(--c-bg)",
                padding: "0.4rem 0.8rem",
                borderRadius: "var(--r-md)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {room.badge}
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,0.6)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "2rem" }}>
          {/* Título y Temporada */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <p
              style={{
                color: "var(--c-gold)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              Habitación {room.nombre}
            </p>
            {room.temporada && (
              <span
                style={{
                  background:
                    room.temporada === "Alta"
                      ? "#e74c3c"
                      : room.temporada === "Especial"
                        ? "#9b59b6"
                        : "#b8860b",
                  color: "#fff",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                {room.temporada}
              </span>
            )}
          </div>

          <h2
            style={{
              fontFamily: "var(--f-heading)",
              fontSize: "2rem",
              color: "var(--c-text)",
              marginBottom: "1rem",
            }}
          >
            {room.nombre}
          </h2>

          {/* Precio Destacado */}
          {room.precio_noche && (
            <div
              style={{
                background: "var(--c-gold-bg)",
                border: "2px solid var(--c-gold)",
                borderRadius: "var(--r-md)",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ color: "var(--c-text-2)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Desde</p>
              <p style={{ color: "var(--c-gold)", fontSize: "1.8rem", fontWeight: 700 }}>
                ${Number(room.precio_noche).toLocaleString("es-CO")}
              </p>
              <p style={{ color: "var(--c-text-2)", fontSize: "0.8rem" }}>por noche · precio referencial</p>
            </div>
          )}

          {/* Descripción Completa */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "var(--c-text-2)", fontSize: "0.9rem", lineHeight: 1.8 }}>
              {room.descripcion_completa || room.descripcion}
            </p>
          </div>

          {/* Grid de Características y Ubicación */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <p style={{ color: "var(--c-text)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                Características
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ color: "var(--c-text-2)", fontSize: "0.85rem" }}>
                  <strong style={{ color: "var(--c-text)" }}>Capacidad:</strong>{" "}
                  {room.capacidad} huésped{room.capacidad !== 1 ? "es" : ""}
                </span>
                <span style={{ color: "var(--c-text-2)", fontSize: "0.85rem" }}>
                  <strong style={{ color: "var(--c-text)" }}>Camas:</strong>{" "}
                  {room.camas} cama{room.camas !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div>
              <p style={{ color: "var(--c-text)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                Ubicación
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {room.ubicacion?.piso && (
                  <span style={{ color: "var(--c-text-2)", fontSize: "0.85rem" }}>
                    <strong style={{ color: "var(--c-text)" }}>Pisos:</strong>{" "}
                    {room.ubicacion.piso}
                  </span>
                )}
                {room.ubicacion?.ala && (
                  <span style={{ color: "var(--c-text-2)", fontSize: "0.85rem" }}>
                    <strong style={{ color: "var(--c-text)" }}>Ala:</strong>{" "}
                    {room.ubicacion.ala}
                  </span>
                )}
                {room.ubicacion?.vista && (
                  <span style={{ color: "var(--c-text-2)", fontSize: "0.85rem" }}>
                    <strong style={{ color: "var(--c-text)" }}>Vista:</strong>{" "}
                    {room.ubicacion.vista}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Amenidades */}
          {Array.isArray(room.amenidades) && room.amenidades.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ color: "var(--c-text)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                Amenidades
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                {room.amenidades.map((a) => (
                  <span
                    key={a}
                    style={{
                      background: "var(--c-gold-bg)",
                      border: "1px solid var(--c-gold-border)",
                      color: "var(--c-gold-light)",
                      borderRadius: "var(--r-sm)",
                      padding: "0.4rem 0.6rem",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>✓</span> {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => { onClose(); onReservar?.(room.nombre); }}
              className="btn btn-gold"
              style={{ flex: 1 }}
            >
              Reservar Esta Habitación
            </button>
            <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
