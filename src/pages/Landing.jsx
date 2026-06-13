import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAuthModal } from "../context/AuthModalContext.jsx";
import GoldDatePicker from "../components/GoldDatePicker.jsx";
import GuestSelector from "../components/GuestSelector.jsx";
import CotizadorPanel from "../components/CotizadorPanel.jsx";
import RoomModal from "../components/RoomModal.jsx";
import {
  IconUsers, IconBed, IconCheck, IconStar,
} from "../components/icons/index.jsx";
import { calcularCotizacion } from "../utils/calcularCotizacion.js";
import { ROUTES } from "../utils/routes.js";
import { buildBookingParams, readBookingParams } from "../utils/bookingParams.js";
import { ROOM } from "../utils/rooms.js";
import { TESTIMONIALS, AMENITIES, getAmenityIcon } from "../utils/landing-content.jsx";

export default function Landing() {
  const { auth } = useAuth();
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* Hidrata desde la URL al montar (para "Modificar búsqueda") */
  const initial = readBookingParams(searchParams);

  const [scrolled, setScrolled] = useState(false);
  const [booking, setBooking] = useState({
    fechaEntrada: initial.fechaEntrada,
    fechaSalida:  initial.fechaSalida,
    tipo:         initial.tipo,
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [huespedes, setHuespedes] = useState({
    adultos: initial.adultos,
    ninos:   initial.ninos,
  });
  const heroRef = useRef(null);

  /* ── Validación del widget ── */
  const roomData     = ROOM.find((r) => r.nombre === booking.tipo) ?? null;
  const totalGuests  = huespedes.adultos + huespedes.ninos;
  const fechasOk     = Boolean(
    booking.fechaEntrada &&
    booking.fechaSalida &&
    booking.fechaSalida > booking.fechaEntrada
  );
  const capacidadOk    = !roomData || totalGuests <= roomData.capacidad;
  const puedeVerificar = fechasOk && capacidadOk;

  /* ── Cotización ── */
  const cotizacion = useMemo(
    () => calcularCotizacion({
      roomData,
      fechaEntrada: booking.fechaEntrada,
      fechaSalida:  booking.fechaSalida,
    }),
    [roomData, booking.fechaEntrada, booking.fechaSalida]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Navegación ── */
  const navegarAReserva = () => {
    const params = buildBookingParams({
      fechaEntrada: booking.fechaEntrada,
      fechaSalida:  booking.fechaSalida,
      tipo:         booking.tipo,
      adultos:      huespedes.adultos,
      ninos:        huespedes.ninos,
    });
    if (auth?.token) {
      navigate(`${ROUTES.DASHBOARD_DISPONIBILIDAD}?${params}`);
    } else {
      navigate(`${ROUTES.HABITACIONES_PUBLICA}?${params}`);
    }
  };

  const irDirectoALogin = () => {
    const params = buildBookingParams({
      fechaEntrada: booking.fechaEntrada,
      fechaSalida:  booking.fechaSalida,
      tipo:         booking.tipo,
      adultos:      huespedes.adultos,
      ninos:        huespedes.ninos,
    });
    if (auth?.token) {
      navigate(`${ROUTES.DASHBOARD_RESERVAS}?${params}`);
    } else {
      openLogin({
        redirectAfter: ROUTES.DASHBOARD_RESERVAS,
        params: Object.fromEntries(params),
      });
    }
  };

  const reservarConTipo = (nombreTipo) => {
    const params = buildBookingParams({
      fechaEntrada: booking.fechaEntrada,
      fechaSalida:  booking.fechaSalida,
      tipo:         nombreTipo,
      adultos:      huespedes.adultos,
      ninos:        huespedes.ninos,
    });
    if (auth?.token) {
      navigate(`${ROUTES.DASHBOARD_RESERVAS}?${params}`);
    } else {
      openLogin({
        redirectAfter: ROUTES.DASHBOARD_RESERVAS,
        params: Object.fromEntries(params),
      });
    }
  };

  const handleBooking = (e) => {
    e.preventDefault();
    if (!puedeVerificar) return;
    navegarAReserva();
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "var(--c-bg)" }}>
      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onReservar={reservarConTipo}
        />
      )}

      <nav className={`landing-nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <button
            type="button"
            className="nav-logo"
            onClick={() => scrollTo("hero")}
            title="Volver al inicio"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
          >
            Grand <span>Stay</span>
          </button>
          <ul className="nav-links">
            {[
              ["Inicio", "hero"],
              ["Habitaciones", "rooms"],
              ["Experiencia", "experience"],
              ["Precios", "pricing"],
              ["Integrantes", "/integrantes"],
            ].map(([l, id]) => (
              <li key={id}>
                <button
                  className="nav-link"
                  style={{ background: "none", cursor: "pointer" }}
                  onClick={() => id.startsWith("/") ? navigate(id) : scrollTo(id)}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            {auth?.token ? (
              <button
                className="btn btn-gold btn-sm"
                onClick={() => navigate("/dashboard")}
              >
                Mi Cuenta
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
                  onClick={() => openLogin()}
                  className="btn btn-outline btn-sm"
                >
                  Reservar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO + WIDGET ── */}
      <section id="hero" className={`hero${cotizacion ? " hero--cotiz-open" : ""}`} ref={heroRef}>
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Hotel Boutique de Lujo</p>
          <h1 className="hero-title">
            Donde el Lujo<br />Se Convierte<br />en <em>Legado</em>
          </h1>
          <p className="hero-sub">
            Una colección de experiencias únicas diseñadas para quienes aprecian lo extraordinario.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold btn-lg" onClick={() => scrollTo("rooms")}>
              Ver Habitaciones
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => scrollTo("experience")}>
              Nuestra Esencia
            </button>
          </div>
        </div>
        <form className="booking-widget" onSubmit={handleBooking}>
          <div className="booking-fields-row">
            <div className="booking-field">
              <label className="booking-label">Llegada</label>
              <GoldDatePicker
                value={booking.fechaEntrada}
                onChange={(v) => setBooking((b) => ({ ...b, fechaEntrada: v }))}
                minDate={new Date().toISOString().split("T")[0]}
                placeholder="dd/mm/aaaa"
                inputClass="booking-input"
              />
            </div>
            <div className="booking-field">
              <label className="booking-label">Salida</label>
              <GoldDatePicker
                value={booking.fechaSalida}
                onChange={(v) => setBooking((b) => ({ ...b, fechaSalida: v }))}
                minDate={booking.fechaEntrada || new Date().toISOString().split("T")[0]}
                placeholder="dd/mm/aaaa"
                inputClass="booking-input"
              />
            </div>
            <div className="booking-field">
              <label className="booking-label">Habitación</label>
              <select
                className="booking-select"
                value={booking.tipo}
                onChange={(e) => setBooking((b) => ({ ...b, tipo: e.target.value }))}
              >
                <option value="">Cualquier tipo</option>
                {ROOM.map((t) => (
                  <option key={t.id} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div className="booking-field">
              <label className="booking-label">Huéspedes</label>
              <GuestSelector
                adultos={huespedes.adultos}
                ninos={huespedes.ninos}
                onChange={setHuespedes}
                capacidadMax={roomData?.capacidad ?? null}
              />
            </div>
            <button
              type="submit"
              className={`btn ${cotizacion ? "btn-outline" : "btn-gold"}`}
              style={{ whiteSpace: "nowrap", fontSize: "0.73rem", padding: "0.75rem 1.1rem" }}
              disabled={!puedeVerificar}
              title={
                !fechasOk
                  ? "Seleccioná las fechas de check-in y check-out"
                  : !capacidadOk
                  ? `Esta habitación admite máximo ${roomData?.capacidad} huésped${roomData?.capacidad !== 1 ? "es" : ""}`
                  : undefined
              }
            >
              {auth?.token ? "Verificar Disponibilidad" : "Ver Habitaciones"}
            </button>
          </div>
          {cotizacion && (
            <CotizadorPanel
              cotizacion={cotizacion}
              fechaEntrada={booking.fechaEntrada}
              fechaSalida={booking.fechaSalida}
              huespedes={huespedes}
              onReservar={irDirectoALogin}
            />
          )}
        </form>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item">
            <div className="number">12+</div>
            <div className="label">Años de Excelencia</div>
          </div>
          <div className="stat-item">
            <div className="number">150+</div>
            <div className="label">Habitaciones Premium</div>
          </div>
          <div className="stat-item">
            <div className="number">4.9 estrellas</div>
            <div className="label">Calificación Promedio</div>
          </div>
        </div>
      </div>

      {/* ── ROOMS ── */}
      <section id="rooms" className="section rooms-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Acomodaciones</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Nuestras Habitaciones</h2>
            <p className="section-sub mt-xs">
              Espacios diseñados para trascender la rutina. Cada estancia es una experiencia curada para sus sentidos.
            </p>
          </div>

          {/* Fila 1: primeras 3 habitaciones */}
          <div className="rooms-grid mt-lg">
            {ROOM.slice(0, 3).map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                clamp={2}
                onVerDetalle={() => setSelectedRoom(room)}
                onReservar={() => reservarConTipo(room.nombre)}
              />
            ))}
          </div>

          {/* Fila 2: Suite Senior + Presidencial, horizontal 50/50 */}
          <div className="rooms-grid-duo mt-sm">
            {ROOM.slice(3).map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                clamp={3}
                featured
                onVerDetalle={() => setSelectedRoom(room)}
                onReservar={() => reservarConTipo(room.nombre)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCIA ── */}
      <section id="experience" className="section experience-section">
        <div className="container">
          <div className="grid-2">
            <div className="experience-img">
              <img
                src="https://images.unsplash.com/photo-1602872030219-ad2b9a54315c?w=900&q=80"
                alt="Suite interior Grand Stay"
                loading="lazy"
              />
            </div>
            <div className="experience-text">
              <p className="eyebrow">Nuestra Filosofía</p>
              <span className="gold-line" />
              <h2 className="section-title">Una Escapada que<br />Recordará Siempre</h2>
              <p className="section-sub mt-sm">
                En Grand Stay no vendemos habitaciones, creamos momentos. Cada rincón ha sido concebido para que su estancia sea un viaje sensorial sin igual.
              </p>
              <div className="experience-list">
                {[
                  ["Diseño", "Interiorismo de autor con materiales nobles y arte original."],
                  ["Gastronomía", "Menú de temporada elaborado por chefs reconocidos internacionalmente."],
                  ["Bienestar", "Spa, yoga y programas de wellness diseñados a su medida."],
                ].map(([h, p]) => (
                  <div key={h} className="exp-item">
                    <div className="exp-icon"><IconCheck /></div>
                    <div className="exp-detail">
                      <h4>{h}</h4>
                      <p>{p}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-lg">
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => scrollTo("rooms")}
                >
                  Descubra Más
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AMENITIES ── */}
      <section className="section amenities-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Comodidades</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Servicios Exclusivos</h2>
          </div>
          <div className="grid-4 mt-lg">
            {AMENITIES.map((a) => (
              <div key={a.title} className="amenity-card">
                <div className="amenity-icon">{getAmenityIcon(a.iconKey)}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Testimonios</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Lo Que Dicen<br />Nuestros Huéspedes</h2>
          </div>
          <div className="grid-3 mt-lg">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => <IconStar key={i} />)}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-platform">{t.platform}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO ── */}
      <div className="promo-banner">
        <div className="container" style={{ textAlign: "center" }}>
          <span className="promo-badge">Oferta Especial - 40% OFF</span>
          <h2 className="promo-title">Paquete Luna de Miel</h2>
          <p style={{ color: "var(--c-text-2)", fontSize: "0.9rem", maxWidth: 480, margin: "0 auto 2rem" }}>
            Suite con cena privada, spa para dos, pétalos de rosa y champagne de bienvenida.
          </p>
          <button
            type="button"
            className="btn btn-gold btn-lg"
            onClick={() => reservarConTipo("Suite Senior")}
          >
            Reservar Ahora
          </button>
        </div>
      </div>

      {/* ── PRICING ── */}
      <section id="pricing" className="section pricing-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Tarifas</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Nuestros Paquetes</h2>
            <p className="section-sub mt-xs">
              Precios por noche en temporada estándar. Incluyen desayuno buffet y acceso al spa.
            </p>
          </div>
          <div className="grid-4 mt-lg">
            {ROOM.map((t, idx) => (
              <div
                key={t.id}
                className={`pricing-card${idx === 2 ? " featured" : ""}`}
              >
                {idx === 2 && (
                  <span className="pricing-featured-badge">Más Popular</span>
                )}
                <p className="pricing-type">{t.nombre}</p>
                <h3 className="pricing-name">
                  {t.camas} cama{t.camas !== 1 ? "s" : ""}
                </h3>
              <div className="pricing-amount">
                {t.precio_noche ? (
                  <>
                    Desde ${Number(t.precio_noche).toLocaleString("es-CO")}
                    <span>/noche</span>
                  </>
                ) : (
                  <span style={{ fontSize: "1rem" }}>Consultar</span>
                )}
              </div>
                <div className="pricing-features">
                  <div className="pricing-feat">
                    <IconCheck />
                    <span>Capacidad: {t.capacidad} huésped{t.capacidad !== 1 ? "es" : ""}</span>
                  </div>
                  <div className="pricing-feat">
                    <IconCheck />
                    <span>Desayuno incluido</span>
                  </div>
                  <div className="pricing-feat">
                    <IconCheck />
                    <span>WiFi premium</span>
                  </div>
                  {t.amenidades?.slice(0, 2).map((a) => (
                    <div key={a} className="pricing-feat">
                      <IconCheck />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={`btn btn-full ${idx === 2 ? "btn-gold" : "btn-outline"}`}
                  onClick={() => reservarConTipo(t.nombre)}
                >
                  Reservar Ahora
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo">Grand <span>Stay</span></div>
              <p>
                Hotel boutique de lujo donde cada detalle ha sido diseñado para brindarle una experiencia única e irrepetible.
              </p>
            </div>
            <div className="footer-col">
              <h4>Navegación</h4>
              <ul className="footer-links">
                {[
                  ["Inicio", "hero"],
                  ["Habitaciones", "rooms"],
                  ["Experiencia", "experience"],
                  ["Precios", "pricing"],
                  ["Integrantes", "/integrantes"],
                ].map(([l, id]) => (
                  <li key={id}>
                    <button
                      type="button"
                      className="footer-link"
                      onClick={() => id.startsWith("/") ? navigate(id) : scrollTo(id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul className="footer-links">
                <li><span className="footer-link">+57 (323) 123-4567</span></li>
                <li><span className="footer-link">info@grandstay.com</span></li>
                <li><span className="footer-link">Villa del Norte, La Reserva</span></li>
                <li><span className="footer-link">Mocoa, Putumayo</span></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Newsletter</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--c-text-2)" }}>
                Reciba nuestras ofertas exclusivas y novedades.
              </p>
              <div className="newsletter-row">
                <input
                  className="newsletter-input"
                  type="email"
                  placeholder="su@correo.com"
                />
                <button className="btn btn-gold btn-sm">OK</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>(C) {new Date().getFullYear()} Grand Stay. Todos los derechos reservados.</p>
            <p>Diseñado con distinción - Grand Stay Hotels</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Room Card — componente local: una tarjeta de tipo de habitación */
/* ───────────────────────────────────────────────────────────── */
function RoomCard({ room, clamp, featured = false, onVerDetalle, onReservar }) {
  return (
    <article className={`room-card${featured ? " room-card--featured" : ""}`}>
      <div className="room-image">
        <img src={room.imagen_url} alt={room.nombre} loading="lazy" />
        {room.badge && (
          <span className="room-badge badge badge-gold">{room.badge}</span>
        )}
      </div>
      <div className="room-info">
        <p className="room-type">Habitación {room.nombre}</p>
        <h3 className="room-name">{room.nombre}</h3>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--c-text-2)",
            marginBottom: "0.65rem",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: clamp,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {room.descripcion}
        </p>
        {room.ubicacion && (
          <p style={{ fontSize: "0.68rem", color: "var(--c-text-3)", marginBottom: "0.6rem", lineHeight: 1.6, opacity: 0.8 }}>
            Pisos {room.ubicacion.piso}
            {room.ubicacion.ala && ` · ${room.ubicacion.ala}`}
            {room.ubicacion.vista && (<><br />{room.ubicacion.vista}</>)}
          </p>
        )}
        <div className="room-features">
          <span className="room-feat">
            <IconUsers /> {room.capacidad} huésped{room.capacidad !== 1 ? "es" : ""}
          </span>
          <span className="room-feat">
            <IconBed /> {room.camas} cama{room.camas !== 1 ? "s" : ""}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "0.75rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {room.precio_noche ? (
            <div className="room-price">
              <span className="amount">Desde ${Number(room.precio_noche).toLocaleString("es-CO")}</span>
              <span className="per">/ noche</span>
            </div>
          ) : (
            <span style={{ color: "var(--c-text-3)", fontSize: "0.8rem" }}>Consultar precio</span>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onVerDetalle}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            >
              Ver detalle
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onReservar}
            >
              Reservar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
