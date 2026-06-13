import { useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAuthModal } from "../context/AuthModalContext.jsx";
import { ROUTES, withParams } from "../utils/routes.js";
import { buildBookingParams, readBookingParams } from "../utils/bookingParams.js";
import { formatDateShort, calcularNoches, pluralizar } from "../utils/format.js";
import { IconUsers, IconBed } from "../components/icons/index.jsx";
import { calcularCotizacion } from "../utils/calcularCotizacion.js";
import { ROOM } from "../utils/rooms.js";

/* ─── COMPONENT ──────────────────────────────────────────────── */
export default function DisponibilidadPublica() {
  const { auth }         = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();

  const fechaEntrada = searchParams.get("fechaEntrada") || "";
  const fechaSalida  = searchParams.get("fechaSalida")  || "";
  const tipoParam    = searchParams.get("tipo")         || "";
  const adultos      = parseInt(searchParams.get("adultos") || "2", 10);
  const ninos        = parseInt(searchParams.get("ninos")   || "0", 10);
  const totalGuests  = adultos + ninos;
  const tieneFechas  = Boolean(
    fechaEntrada && fechaSalida && fechaSalida > fechaEntrada
  );
  const noches = calcularNoches(fechaEntrada, fechaSalida);

  /* Habitaciones que caben el grupo, tipo solicitado primero */
  const roomsFiltradas = useMemo(() => {
    return ROOM
      .filter((r) => r.capacidad >= totalGuests)
      .sort((a, b) => {
        if (tipoParam) {
          if (a.nombre === tipoParam) return -1;
          if (b.nombre === tipoParam) return 1;
        }
        return a.precio_noche - b.precio_noche;
      });
  }, [totalGuests, tipoParam]);

  /* Cotización por habitación (solo si hay fechas) */
  const cotizaciones = useMemo(() => {
    if (!tieneFechas) return {};
    const out = {};
    roomsFiltradas.forEach((r) => {
      out[r.id] = calcularCotizacion({ roomData: r, fechaEntrada, fechaSalida });
    });
    return out;
  }, [roomsFiltradas, fechaEntrada, fechaSalida, tieneFechas]);

  return (
    <div style={{ background: "var(--c-bg)", minHeight: "100vh" }}>

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav
        className="landing-nav scrolled"
        style={{ position: "sticky", top: 0 }}
      >
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            Grand <span>Stay</span>
          </Link>
          <div className="nav-actions">
            {auth?.token ? (
              <button
                className="btn btn-gold btn-sm"
                onClick={() => navigate("/dashboard")}
              >
                Mi Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openLogin()}
                  className="nav-link"
                  style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => openRegister()}
                  className="btn btn-outline btn-sm"
                >
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── BARRA DE BÚSQUEDA ─────────────────────────────── */}
      <div
        style={{
          background: "var(--c-surface)",
          borderBottom: "1px solid var(--c-gold-border)",
          padding: "1rem 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <Dato label="Fechas">
              {tieneFechas
              ? `${formatDateShort(fechaEntrada)} → ${formatDateShort(fechaSalida)}`
              : "Sin fechas"}
              {noches > 0 && (
                <span style={{ color: "var(--c-text-3)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>
                  · {noches} noche{noches !== 1 ? "s" : ""}
                </span>
              )}
            </Dato>
            <Dato label="Huéspedes">
              {adultos} adulto{adultos !== 1 ? "s" : ""}
              {ninos > 0 && `, ${ninos} niño${ninos !== 1 ? "s" : ""}`}
            </Dato>
            {tipoParam && <Dato label="Tipo solicitado">{tipoParam}</Dato>}
          </div>
          <Link
            to={withParams(ROUTES.HOME, {
              fechaEntrada,
              fechaSalida,
              tipo:    tipoParam,
              adultos: String(adultos),
              ninos:   ninos > 0 ? String(ninos) : "",
            })}
            className="btn btn-ghost btn-sm"
          >
            ← Modificar búsqueda
          </Link>
        </div>
      </div>

      {/* ── RESULTADOS ────────────────────────────────────── */}
      <div className="container" style={{ padding: "2.5rem 2rem 4rem" }}>

        {/* Encabezado */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>
            Nuestras habitaciones
          </p>
          <h1
            style={{
              fontFamily: "var(--f-heading)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: 600,
              color: "var(--c-text)",
              marginBottom: "0.4rem",
            }}
          >
            {roomsFiltradas.length > 0
              ? `${roomsFiltradas.length} tipo${roomsFiltradas.length !== 1 ? "s" : ""} de habitación para tu grupo`
              : "Sin opciones para tu búsqueda"}
          </h1>
          {tieneFechas && roomsFiltradas.length > 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--c-text-2)" }}>
              Precios estimados con IVA incluido (19%)
              &nbsp;·&nbsp;
              La disponibilidad real para tus fechas se verifica al iniciar sesión
            </p>
          )}
        </div>

        {/* Grid de habitaciones */}
        {roomsFiltradas.length > 0 ? (
          <>
            <div className="grid-4" style={{ alignItems: "start" }}>
              {roomsFiltradas.map((room) => {
                const cotiz        = cotizaciones[room.id] ?? null;
                const esSolicitada = room.nombre === tipoParam;

                return (
                  <article
                    key={room.id}
                    className="room-card"
                    style={esSolicitada ? { borderColor: "var(--c-gold)" } : {}}
                  >
                    {/* Imagen */}
                    <div className="room-image">
                      <img
                        src={room.imagen_url_optimizada}
                        alt={room.nombre}
                        loading="lazy"
                      />
                      {esSolicitada && (
                        <span className="room-badge badge badge-gold">
                          Tu elección
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="room-info">
                      <p className="room-type">Habitación {room.nombre}</p>
                      <h3 className="room-name">{room.nombre}</h3>
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--c-text-2)",
                          marginBottom: "0.75rem",
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {room.descripcion}
                      </p>

                      {/* Capacidad y camas */}
                      <div className="room-features">
                        <span className="room-feat">
                          <IconUsers /> {room.capacidad} huésped{room.capacidad !== 1 ? "es" : ""}
                        </span>
                        <span className="room-feat">
                          <IconBed /> {room.camas} cama{room.camas !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Precio */}
                      <div
                        style={{
                          marginTop: "0.85rem",
                          paddingTop: "0.85rem",
                          borderTop: "1px solid var(--c-border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: cotiz ? "0.4rem" : 0,
                          }}
                        >
                          <span style={{ fontSize: "0.7rem", color: "var(--c-text-2)" }}>
                            Desde
                          </span>
                          <div className="room-price">
                            <span className="amount">
                              ${room.precio_noche.toLocaleString("es-CO")}
                            </span>
                            <span className="per">/noche</span>
                          </div>
                        </div>

                        {cotiz && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              background: "var(--c-gold-bg)",
                              border: "1px solid var(--c-gold-border)",
                              borderRadius: "var(--r-sm)",
                              padding: "0.45rem 0.65rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.62rem",
                                color: "var(--c-gold)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                              }}
                            >
                              Total c/IVA · {cotiz.noches}n
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--f-heading)",
                                fontSize: "1.05rem",
                                fontWeight: 700,
                                color: "var(--c-gold-light)",
                              }}
                            >
                              ${cotiz.fmt.total}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        type="button"
                        className={`btn btn-full ${esSolicitada ? "btn-gold" : "btn-outline"}`}
                        style={{ marginTop: "1rem" }}
                        onClick={() =>
                          openLogin({
                            redirectAfter: ROUTES.DASHBOARD_RESERVAS,
                            params: Object.fromEntries(
                              buildBookingParams({ fechaEntrada, fechaSalida, tipo: room.nombre, adultos, ninos })
                            ),
                          })
                        }
                      >
                        Seleccionar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Nota inferior */}
            <div
              style={{
                marginTop: "3rem",
                padding: "1.5rem 2rem",
                background: "var(--c-surface)",
                border: "1px solid var(--c-gold-border)",
                borderRadius: "var(--r-md)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--c-text-2)",
                  lineHeight: 1.7,
                  marginBottom: "1.1rem",
                }}
              >
                <strong style={{ color: "var(--c-gold)" }}>¿Todo listo?</strong>
                {" "}Iniciá sesión para confirmar tu reserva. Si todavía no tenés cuenta,
                podés crear una en menos de un minuto.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  onClick={() => openLogin()}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openRegister()}
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Estado vacío */
          <div className="empty-state">
            <svg
              width="52" height="52" fill="none"
              stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24"
              style={{ opacity: 0.3 }}
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <p>
              No hay habitaciones con capacidad para{" "}
              {totalGuests} huésped{totalGuests !== 1 ? "es" : ""}.
            </p>
            <Link
              to="/"
              className="btn btn-outline btn-sm"
              style={{ marginTop: "0.5rem" }}
            >
              Volver a buscar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── HELPER UI ──────────────────────────────────────────────── */
function Dato({ label, children }) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--c-gold)",
          marginBottom: "0.15rem",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "0.88rem", color: "var(--c-text)" }}>{children}</p>
    </div>
  );
}
