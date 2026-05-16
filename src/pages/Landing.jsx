import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoldDatePicker from '../components/GoldDatePicker.jsx';

const ROOMS = [
  {
    id: 1,
    type: 'Habitación Clásica',
    name: 'Confort Atemporal',
    desc: 'Elegancia minimalista con vistas panorámicas, ropa de cama de 600 hilos y baño en mármol.',
    price: '$450.000',
    capacity: '2 huéspedes',
    size: '38 m²',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=80',
    badge: 'Más solicitada',
  },
  {
    id: 2,
    type: 'Suite Ejecutiva',
    name: 'Distinción Sin Límites',
    desc: 'Sala de estar independiente, escritorio premium y acceso al salón ejecutivo con servicio 24/7.',
    price: '$850.000',
    capacity: '2 huéspedes',
    size: '62 m²',
    img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&q=80',
    badge: null,
  },
  {
    id: 3,
    type: 'Suite Presidencial',
    name: 'La Cumbre del Lujo',
    desc: 'Terraza privada, cocina equipada, bañera de hidromasaje y mayordomo personal las 24 horas.',
    price: '$1.850.000',
    capacity: '4 huéspedes',
    size: '110 m²',
    img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&q=80',
    badge: 'Premium',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Una experiencia que redefine el significado del lujo. Cada detalle fue cuidado con una atención que pocas veces he visto en mis 20 años de viajes de negocios.',
    name: 'Carlos Mendoza',
    platform: 'Booking.com · ★★★★★',
    avatar: 'https://i.pravatar.cc/80?img=12',
  },
  {
    quote: 'La suite presidencial superó todas mis expectativas. El personal anticipaba cada necesidad antes de expresarla. Volveré sin dudarlo.',
    name: 'Sofía Hartmann',
    platform: 'TripAdvisor · ★★★★★',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    quote: 'Pasé mi luna de miel en Grand Stay y fue mágico. El spa, el restaurante, la vista... todo perfectamente orquestado. Gracias por hacer ese momento eterno.',
    name: 'Alejandro & Valeria',
    platform: 'Google Reviews · ★★★★★',
    avatar: 'https://i.pravatar.cc/80?img=23',
  },
];

const AMENITIES = [
  { icon: <IconSpa />,     title: 'Spa & Wellness',        desc: 'Tratamientos exclusivos, sauna finlandesa y piscina de hidromasaje con agua termal.' },
  { icon: <IconDining />,  title: 'Alta Gastronomía',      desc: 'Restaurante con chef galardonado. Cocina de autor con ingredientes de temporada.' },
  { icon: <IconCar />,     title: 'Traslado Privado',      desc: 'Flota de vehículos de lujo disponibles al aeropuerto y destinos locales.' },
  { icon: <IconConcierge />, title: 'Concierge 24/7',     desc: 'Reservas, recomendaciones y atención personalizada en cualquier momento.' },
];

function StarIcon() {
  return (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

export default function Landing() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [booking, setBooking] = useState({ fechaEntrada: '', fechaSalida: '', tipo: '' });
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBooking = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (booking.fechaEntrada) params.set('fechaEntrada', booking.fechaEntrada);
    if (booking.fechaSalida)  params.set('fechaSalida',  booking.fechaSalida);
    if (booking.tipo)         params.set('tipo',         booking.tipo);

    if (auth?.token) {
      navigate(`/dashboard/disponibilidad?${params}`);
    } else {
      navigate(`/login?redirect=/dashboard/disponibilidad&${params}`);
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--c-bg)' }}>
      {/* ── NAV ────────────────────────────────────────── */}
      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo">Grand <span>Stay</span></div>
          <ul className="nav-links">
            {[['Inicio','hero'],['Habitaciones','rooms'],['Experiencia','experience'],['Precios','pricing']].map(([l,id]) => (
              <li key={id}>
                <button className="nav-link" style={{ background:'none',cursor:'pointer' }} onClick={() => scrollTo(id)}>{l}</button>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            {auth?.token ? (
              <button className="btn btn-gold btn-sm" onClick={() => navigate('/dashboard')}>
                Mi Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="nav-link">Iniciar sesión</Link>
                <Link to="/registro" className="btn btn-outline btn-sm">Reservar</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section id="hero" className="hero" ref={heroRef}>
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Hotel Boutique de Lujo</p>
          <h1 className="hero-title">
            Donde el Lujo<br />
            Se Convierte<br />
            en <em>Legado</em>
          </h1>
          <p className="hero-sub">
            Una colección de experiencias únicas diseñadas para quienes aprecian lo extraordinario.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold btn-lg" onClick={() => scrollTo('rooms')}>
              Ver Habitaciones
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => scrollTo('experience')}>
              Nuestra Esencia
            </button>
          </div>
        </div>

        {/* Booking Widget */}
        <form className="booking-widget" onSubmit={handleBooking}>
          <div className="booking-field">
            <label className="booking-label">Check-In</label>
            <GoldDatePicker
              value={booking.fechaEntrada}
              onChange={(v) => setBooking((b) => ({ ...b, fechaEntrada: v }))}
              minDate={new Date().toISOString().split('T')[0]}
              placeholder="dd/mm/aaaa"
              inputClass="booking-input"
            />
          </div>
          <div className="booking-field">
            <label className="booking-label">Check-Out</label>
            <GoldDatePicker
              value={booking.fechaSalida}
              onChange={(v) => setBooking((b) => ({ ...b, fechaSalida: v }))}
              minDate={booking.fechaEntrada || new Date().toISOString().split('T')[0]}
              placeholder="dd/mm/aaaa"
              inputClass="booking-input"
            />
          </div>
          <div className="booking-field">
            <label className="booking-label">Tipo de Habitación</label>
            <select
              className="booking-select"
              value={booking.tipo}
              onChange={(e) => setBooking((b) => ({ ...b, tipo: e.target.value }))}
            >
              <option value="">Cualquier tipo</option>
              <option value="Clásica">Habitación Clásica</option>
              <option value="Suite Ejecutiva">Suite Ejecutiva</option>
              <option value="Suite Presidencial">Suite Presidencial</option>
            </select>
          </div>
          <button type="submit" className="btn btn-gold" style={{ whiteSpace: 'nowrap' }}>
            Verificar Disponibilidad
          </button>
        </form>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="number">12+</div><div className="label">Años de Excelencia</div></div>
          <div className="stat-item"><div className="number">150+</div><div className="label">Habitaciones Premium</div></div>
          <div className="stat-item"><div className="number">4.9★</div><div className="label">Calificación Promedio</div></div>
        </div>
      </div>

      {/* ── ROOMS ───────────────────────────────────────── */}
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
          <div className="grid-3 mt-lg">
            {ROOMS.map((room) => (
              <article key={room.id} className="room-card">
                <div className="room-image">
                  <img src={room.img} alt={room.name} loading="lazy" />
                  {room.badge && (
                    <span className="room-badge badge badge-gold">{room.badge}</span>
                  )}
                </div>
                <div className="room-info">
                  <p className="room-type">{room.type}</p>
                  <h3 className="room-name">{room.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', marginBottom: '1rem', lineHeight: 1.7 }}>
                    {room.desc}
                  </p>
                  <div className="room-features">
                    <span className="room-feat"><IconUsers /> {room.capacity}</span>
                    <span className="room-feat"><IconMaximize /> {room.size}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                    <div className="room-price">
                      <span className="amount">{room.price}</span>
                      <span className="per">/ noche</span>
                    </div>
                    <Link to="/registro" className="btn btn-outline btn-sm">Reservar</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ──────────────────────────────────── */}
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
                En Grand Stay no vendemos habitaciones, creamos momentos. Cada rincón ha sido
                concebido para que su estancia sea un viaje sensorial sin igual.
              </p>
              <div className="experience-list">
                {[
                  ['Diseño', 'Interiorismo de autor con materiales nobles y arte original.'],
                  ['Gastronomía', 'Menú de temporada elaborado por chefs reconocidos internacionalmente.'],
                  ['Bienestar', 'Spa, yoga y programas de wellness diseñados a su medida.'],
                ].map(([h, p]) => (
                  <div key={h} className="exp-item">
                    <div className="exp-icon"><IconCheck /></div>
                    <div className="exp-detail"><h4>{h}</h4><p>{p}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-lg">
                <Link to="/login" className="btn btn-gold">Descubra Más</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AMENITIES ───────────────────────────────────── */}
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
                <div className="amenity-icon">{a.icon}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
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
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
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

      {/* ── PROMO BANNER ────────────────────────────────── */}
      <div className="promo-banner">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="promo-badge">Oferta Especial · 40% OFF</span>
          <h2 className="promo-title">Paquete Luna de Miel</h2>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 2rem' }}>
            Suite Presidencial con cena privada, spa para dos, pétalos de rosa y champagne de bienvenida.
          </p>
          <Link to="/registro" className="btn btn-gold btn-lg">Reservar Ahora</Link>
        </div>
      </div>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="section pricing-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Tarifas</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Nuestros Paquetes</h2>
            <p className="section-sub mt-xs">
              Precios por noche en temporada estándar en pesos colombianos (COP). Incluyen desayuno buffet y acceso al spa.
            </p>
          </div>
          <div className="grid-3 mt-lg">
            {[
              { type: 'Estándar', name: 'Habitación Clásica', price: '$450.000', features: ['Desayuno incluido','Wifi premium','Acceso al spa','Servicio de habitaciones'], featured: false },
              { type: 'Business', name: 'Suite Ejecutiva', price: '$850.000', features: ['Desayuno + cena','Wifi premium','Spa ilimitado','Traslado aeropuerto','Salón ejecutivo'], featured: true },
              { type: 'Prestige', name: 'Suite Presidencial', price: '$1.850.000', features: ['Todo incluido','Mayordomo 24/7','Terraza privada','Cena privada','Helipuerto'], featured: false },
            ].map((p) => (
              <div key={p.name} className={`pricing-card${p.featured ? ' featured' : ''}`}>
                {p.featured && <span className="pricing-featured-badge">Más Popular</span>}
                <p className="pricing-type">{p.type}</p>
                <h3 className="pricing-name">{p.name}</h3>
                <div className="pricing-amount">{p.price}<span>/noche</span></div>
                <div className="pricing-features">
                  {p.features.map((f) => (
                    <div key={f} className="pricing-feat">
                      <IconCheck /><span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/registro" className={`btn btn-full ${p.featured ? 'btn-gold' : 'btn-outline'}`}>
                  Reservar Ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo">Grand <span>Stay</span></div>
              <p>Hotel boutique de lujo donde cada detalle ha sido diseñado para brindarle una experiencia única e irrepetible.</p>
            </div>
            <div className="footer-col">
              <h4>Navegación</h4>
              <ul className="footer-links">
                {['Inicio','Habitaciones','Experiencia','Precios'].map((l) => (
                  <li key={l}><a className="footer-link" href="#hero">{l}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul className="footer-links">
                <li><span className="footer-link">+1 (809) 555-0142</span></li>
                <li><span className="footer-link">info@grandstay.com</span></li>
                <li><span className="footer-link">Av. del Lujo 2040</span></li>
                <li><span className="footer-link">Santo Domingo, RD</span></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Newsletter</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>Reciba nuestras ofertas exclusivas y novedades.</p>
              <div className="newsletter-row">
                <input className="newsletter-input" type="email" placeholder="su@correo.com" />
                <button className="btn btn-gold btn-sm">OK</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Grand Stay. Todos los derechos reservados.</p>
            <p>Diseñado con distinción · Grand Stay Hotels</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── ICONS ──────────────────────────────────────────────────── */
const s = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const s16 = { ...s, width: 16, height: 16 };
function IconSpa()       { return <svg {...s} viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/></svg>; }
function IconDining()    { return <svg {...s} viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>; }
function IconCar()       { return <svg {...s} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>; }
function IconConcierge() { return <svg {...s} viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>; }
function IconCheck()     { return <svg {...s16} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconUsers()     { return <svg {...s16} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconMaximize()  { return <svg {...s16} viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>; }
