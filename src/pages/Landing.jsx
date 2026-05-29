import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoldDatePicker from '../components/GoldDatePicker.jsx';
import { api } from '../services/api.js';

/* --- ICONS ---------------------------------------------------- */
const s = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const s16 = { ...s, width: 16, height: 16 };
function IconSpa()       { return <svg {...s} viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /></svg>; }
function IconDining()    { return <svg {...s} viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>; }
function IconCar()       { return <svg {...s} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>; }
function IconConcierge() { return <svg {...s} viewBox="0 0 24 24"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>; }
function IconCheck()     { return <svg {...s16} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>; }
function IconUsers()     { return <svg {...s16} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconBed()       { return <svg {...s16} viewBox="0 0 24 24"><path d="M2 4v16" /><path d="M22 8H2" /><rect x="2" y="8" width="20" height="10" rx="2" /><path d="M6 8V4" /><path d="M22 8v12" /></svg>; }

/* --- CONSTANTES ----------------------------------------------- */
const TESTIMONIALS = [
  {
    quote: 'Una experiencia que redefine el significado del lujo. Cada detalle fue cuidado con una atención que pocas veces he visto en mis 20 años de viajes de negocios.',
    name: 'Carlos Mendoza',
    platform: 'Booking.com - 5 estrellas',
    avatar: 'https://i.pravatar.cc/80?img=12',
  },
  {
    quote: 'La suite presidencial superó todas mis expectativas. El personal anticipaba cada necesidad antes de expresarla. Volveré sin dudarlo.',
    name: 'Sofia Hartmann',
    platform: 'TripAdvisor - 5 estrellas',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    quote: 'Pasé mi luna de miel en Grand Stay y fue mágico. El spa, el restaurante, la vista... todo perfectamente orquestado.',
    name: 'Alejandro & Valeria',
    platform: 'Google Reviews - 5 estrellas',
    avatar: 'https://i.pravatar.cc/80?img=23',
  },
];

const AMENITIES = [
  { icon: <IconSpa />,       title: 'Spa & Wellness',    desc: 'Tratamientos exclusivos, sauna finlandesa y piscina de hidromasaje con agua termal.' },
  { icon: <IconDining />,    title: 'Alta Gastronomía',  desc: 'Restaurante con chef galardonado. Cocina de autor con ingredientes de temporada.' },
  { icon: <IconCar />,       title: 'Traslado Privado',  desc: 'Flota de vehículos de lujo disponibles al aeropuerto y destinos locales.' },
  { icon: <IconConcierge />, title: 'Concierge 24/7',    desc: 'Reservas, recomendaciones y atención personalizada en cualquier momento.' },
];

function StarIcon() {
  return (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function RoomModal({ room, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-gold-border)',
          borderRadius: 'var(--r-lg)', maxWidth: 640, width: '100%',
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={room.imagen_url}
          alt={room.nombre}
          style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
          }}
          aria-label="Cerrar"
        >X</button>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--c-gold)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.25rem' }}>
            Habitación
          </p>
          <h2 style={{ fontFamily: 'var(--f-heading)', fontSize: '1.5rem', color: 'var(--c-text)', marginBottom: '0.75rem' }}>
            {room.nombre}
          </h2>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            {room.descripcion}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--c-text-2)', fontSize: '0.8rem' }}>
              <strong style={{ color: 'var(--c-text)' }}>Capacidad:</strong> {room.capacidad} huésped{room.capacidad !== 1 ? 'es' : ''}
            </span>
            <span style={{ color: 'var(--c-text-2)', fontSize: '0.8rem' }}>
              <strong style={{ color: 'var(--c-text)' }}>Camas:</strong> {room.camas}
            </span>
            {room.precio_noche && (
              <span style={{ color: 'var(--c-gold)', fontSize: '0.9rem', fontWeight: 600 }}>
                ${Number(room.precio_noche).toLocaleString('es-CO')} / noche
              </span>
            )}
          </div>
          {Array.isArray(room.amenidades) && room.amenidades.length > 0 && (
            <div>
              <p style={{ color: 'var(--c-text)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Amenidades
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {room.amenidades.map((a) => (
                  <span key={a} style={{ background: 'var(--c-gold-bg)', border: '1px solid var(--c-gold-border)', color: 'var(--c-gold-light)', borderRadius: 'var(--r-sm)', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>{a}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/registro" className="btn btn-gold" style={{ display: 'inline-block' }}>Reservar Esta Habitación</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [booking, setBooking] = useState({ fechaEntrada: '', fechaSalida: '', tipo: '' });
  const [tipos, setTipos] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.habitacionesTipos.listar()
      .then((res) => setTipos(res.data ?? res))
      .catch(() => {});
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
      {selectedRoom && <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />}

      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo">Grand <span>Stay</span></div>
          <ul className="nav-links">
            {[['Inicio', 'hero'], ['Habitaciones', 'rooms'], ['Experiencia', 'experience'], ['Precios', 'pricing']].map(([l, id]) => (
              <li key={id}><button className="nav-link" style={{ background: 'none', cursor: 'pointer' }} onClick={() => scrollTo(id)}>{l}</button></li>
            ))}
          </ul>
          <div className="nav-actions">
            {auth?.token ? (
              <button className="btn btn-gold btn-sm" onClick={() => navigate('/dashboard')}>Mi Dashboard</button>
            ) : (
              <>
                <Link to="/login" className="nav-link">Iniciar sesión</Link>
                <Link to="/registro" className="btn btn-outline btn-sm">Reservar</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section id="hero" className="hero" ref={heroRef}>
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Hotel Boutique de Lujo</p>
          <h1 className="hero-title">Donde el Lujo<br />Se Convierte<br />en <em>Legado</em></h1>
          <p className="hero-sub">Una colección de experiencias únicas diseñadas para quienes aprecian lo extraordinario.</p>
          <div className="hero-actions">
            <button className="btn btn-gold btn-lg" onClick={() => scrollTo('rooms')}>Ver Habitaciones</button>
            <button className="btn btn-ghost btn-lg" onClick={() => scrollTo('experience')}>Nuestra Esencia</button>
          </div>
        </div>
        <form className="booking-widget" onSubmit={handleBooking}>
          <div className="booking-field">
            <label className="booking-label">Check-In</label>
            <GoldDatePicker value={booking.fechaEntrada} onChange={(v) => setBooking((b) => ({ ...b, fechaEntrada: v }))} minDate={new Date().toISOString().split('T')[0]} placeholder="dd/mm/aaaa" inputClass="booking-input" />
          </div>
          <div className="booking-field">
            <label className="booking-label">Check-Out</label>
            <GoldDatePicker value={booking.fechaSalida} onChange={(v) => setBooking((b) => ({ ...b, fechaSalida: v }))} minDate={booking.fechaEntrada || new Date().toISOString().split('T')[0]} placeholder="dd/mm/aaaa" inputClass="booking-input" />
          </div>
          <div className="booking-field">
            <label className="booking-label">Tipo de Habitación</label>
            <select className="booking-select" value={booking.tipo} onChange={(e) => setBooking((b) => ({ ...b, tipo: e.target.value }))}>
              <option value="">Cualquier tipo</option>
              {tipos.map((t) => (<option key={t.id_tipo} value={t.nombre}>{t.nombre}</option>))}
            </select>
          </div>
          <button type="submit" className="btn btn-gold" style={{ whiteSpace: 'nowrap' }}>Verificar Disponibilidad</button>
        </form>
      </section>

      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="number">12+</div><div className="label">Años de Excelencia</div></div>
          <div className="stat-item"><div className="number">150+</div><div className="label">Habitaciones Premium</div></div>
          <div className="stat-item"><div className="number">4.9 estrellas</div><div className="label">Calificación Promedio</div></div>
        </div>
      </div>

      <section id="rooms" className="section rooms-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Acomodaciones</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Nuestras Habitaciones</h2>
            <p className="section-sub mt-xs">Espacios diseñados para trascender la rutina. Cada estancia es una experiencia curada para sus sentidos.</p>
          </div>
          <div className="grid-4 mt-lg">
            {tipos.map((room, idx) => (
              <article key={room.id_tipo} className="room-card">
                <div className="room-image">
                  <img src={room.imagen_url} alt={room.nombre} loading="lazy" />
                  {idx === 0 && <span className="room-badge badge badge-gold">Más solicitada</span>}
                </div>
                <div className="room-info">
                  <p className="room-type">Habitación {room.nombre}</p>
                  <h3 className="room-name">{room.nombre}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', marginBottom: '1rem', lineHeight: 1.7 }}>{room.descripcion}</p>
                  <div className="room-features">
                    <span className="room-feat"><IconUsers /> {room.capacidad} huésped{room.capacidad !== 1 ? 'es' : ''}</span>
                    <span className="room-feat"><IconBed /> {room.camas}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {room.precio_noche ? (
                      <div className="room-price"><span className="amount">${Number(room.precio_noche).toLocaleString('es-CO')}</span><span className="per">/ noche</span></div>
                    ) : (
                      <span style={{ color: 'var(--c-text-3)', fontSize: '0.8rem' }}>Consultar precio</span>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRoom(room)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>Ver detalle</button>
                      <Link to="/registro" className="btn btn-outline btn-sm">Reservar</Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="section experience-section">
        <div className="container">
          <div className="grid-2">
            <div className="experience-img">
              <img src="https://images.unsplash.com/photo-1602872030219-ad2b9a54315c?w=900&q=80" alt="Suite interior Grand Stay" loading="lazy" />
            </div>
            <div className="experience-text">
              <p className="eyebrow">Nuestra Filosofía</p>
              <span className="gold-line" />
              <h2 className="section-title">Una Escapada que<br />Recordará Siempre</h2>
              <p className="section-sub mt-sm">En Grand Stay no vendemos habitaciones, creamos momentos. Cada rincón ha sido concebido para que su estancia sea un viaje sensorial sin igual.</p>
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
              <div className="mt-lg"><Link to="/login" className="btn btn-gold">Descubra Más</Link></div>
            </div>
          </div>
        </div>
      </section>

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
                <div className="testimonial-stars">{[...Array(5)].map((_, i) => <StarIcon key={i} />)}</div>
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

      <div className="promo-banner">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="promo-badge">Oferta Especial - 40% OFF</span>
          <h2 className="promo-title">Paquete Luna de Miel</h2>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 2rem' }}>Suite con cena privada, spa para dos, pétalos de rosa y champagne de bienvenida.</p>
          <Link to="/registro" className="btn btn-gold btn-lg">Reservar Ahora</Link>
        </div>
      </div>

      <section id="pricing" className="section pricing-section">
        <div className="container">
          <div className="section-center mb-md">
            <p className="eyebrow">Tarifas</p>
            <span className="gold-line gold-line-center" />
            <h2 className="section-title">Nuestros Paquetes</h2>
            <p className="section-sub mt-xs">Precios por noche en temporada estándar. Incluyen desayuno buffet y acceso al spa.</p>
          </div>
          <div className="grid-4 mt-lg">
            {tipos.map((t, idx) => (
              <div key={t.id_tipo} className={`pricing-card${idx === 2 ? ' featured' : ''}`}>
                {idx === 2 && <span className="pricing-featured-badge">Más Popular</span>}
                <p className="pricing-type">{t.nombre}</p>
                <h3 className="pricing-name">{t.camas}</h3>
                <div className="pricing-amount">
                  {t.precio_noche ? <>${Number(t.precio_noche).toLocaleString('es-CO')}<span>/noche</span></> : <span style={{ fontSize: '1rem' }}>Consultar</span>}
                </div>
                <div className="pricing-features">
                  <div className="pricing-feat"><IconCheck /><span>Capacidad: {t.capacidad} huésped{t.capacidad !== 1 ? 'es' : ''}</span></div>
                  <div className="pricing-feat"><IconCheck /><span>{t.camas}</span></div>
                  <div className="pricing-feat"><IconCheck /><span>Desayuno incluido</span></div>
                  <div className="pricing-feat"><IconCheck /><span>WiFi premium</span></div>
                  {t.amenidades?.slice(0, 2).map((a) => (<div key={a} className="pricing-feat"><IconCheck /><span>{a}</span></div>))}
                </div>
                <Link to="/registro" className={`btn btn-full ${idx === 2 ? 'btn-gold' : 'btn-outline'}`}>Reservar Ahora</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                {['Inicio', 'Habitaciones', 'Experiencia', 'Precios'].map((l) => (<li key={l}><a className="footer-link" href="#hero">{l}</a></li>))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul className="footer-links">
                <li><span className="footer-link">+57 (323) 123-4567</span></li>
                <li><span className="footer-link">info@grandstay.com</span></li>
                <li><span className="footer-link">Av. del Lujo, Las Villas</span></li>
                <li><span className="footer-link">Mocoa, PTYO</span></li>
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
            <p>(C) {new Date().getFullYear()} Grand Stay. Todos los derechos reservados.</p>
            <p>Diseñado con distinción - Grand Stay Hotels</p>
          </div>
        </div>
      </footer>
    </div>
  );
}