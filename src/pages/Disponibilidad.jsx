import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import GoldDatePicker from '../components/GoldDatePicker.jsx';
import { isHuesped, isRecepcionista } from '../utils/roles.js';

const ESTADO_COLORS = {
  disponible: 'badge-success',
  ocupada:    'badge-error',
  limpieza:   'badge-warning',
  mantenimiento: 'badge-info',
  bloqueada:  'badge-info',
};

const ESTADO_LABELS = {
  disponible: 'Disponible',
  ocupada:    'Ocupada',
  limpieza:   'Limpieza',
  mantenimiento: 'Mantenimiento',
  bloqueada:  'Bloqueada',
};

export default function Disponibilidad() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    fechaEntrada: searchParams.get('fechaEntrada') || today,
    fechaSalida:  searchParams.get('fechaSalida')  || tomorrow,
    tipo:         searchParams.get('tipo')         || '',
    capacidad:    searchParams.get('capacidad')    || '',
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const canQuery = isRecepcionista(auth?.rol) || isHuesped(auth?.rol);

  const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!canQuery) {
      setAccessDenied(true);
      return;
    }
    if (!filters.fechaEntrada || !filters.fechaSalida) {
      addToast('Debe seleccionar fechas de entrada y salida.', 'warning');
      return;
    }
    setLoading(true);
    setSearched(true);
    setAccessDenied(false);
    try {
      const params = { fechaEntrada: filters.fechaEntrada, fechaSalida: filters.fechaSalida };
      if (filters.tipo)      params.tipo      = filters.tipo;
      if (filters.capacidad) params.capacidad = filters.capacidad;
      const data = await api.disponibilidad.consultar(params, auth.token);
      let habitaciones = data.habitaciones ?? data ?? [];
      // Filtro exacto de capacidad en cliente: si el usuario pide N personas,
      // muestra solo habitaciones con esa capacidad exacta.
      if (filters.capacidad) {
        const cap = parseInt(filters.capacidad, 10);
        habitaciones = habitaciones.filter((r) => Number(r.capacidad_max ?? r.capacidad) >= cap);
      }
      setRooms(habitaciones);
    } catch (err) {
      if (err.status === 403) {
        setAccessDenied(true);
        setSearched(false);
      } else {
        addToast(err.message ?? 'Error al consultar disponibilidad', 'error');
      }
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if params come from URL (booking widget)
  useEffect(() => {
    if (searchParams.get('fechaEntrada') && searchParams.get('fechaSalida')) {
      handleSearch({ preventDefault: () => {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReservar = (room) => {
    navigate('/dashboard/reservas', { state: { room, fechaEntrada: filters.fechaEntrada, fechaSalida: filters.fechaSalida } });
  };

  return (
    <>
      <div className="page-header">
        <h1>Consulta de Disponibilidad</h1>
        <p>Consulte habitaciones libres por fechas, tipo y capacidad</p>
      </div>

      {/* Search form */}
      <div className="search-panel">
        <h3>Parámetros de búsqueda</h3>
        <form onSubmit={handleSearch}>
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha de entrada</label>
              <GoldDatePicker
                value={filters.fechaEntrada}
                onChange={(v) => setFilters((f) => ({ ...f, fechaEntrada: v }))}
                minDate={today}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de salida</label>
              <GoldDatePicker
                value={filters.fechaSalida}
                onChange={(v) => setFilters((f) => ({ ...f, fechaSalida: v }))}
                minDate={filters.fechaEntrada || today}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de habitación</label>
              <select className="form-select" value={filters.tipo} onChange={set('tipo')}>
                <option value="">Todos los tipos</option>
                <option value="Individual">Individual</option>
                <option value="Doble">Doble</option>
                <option value="Suite">Suite</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Personas</label>
              <input type="number" className="form-input" placeholder="Ej. 2" min="1" max="4" value={filters.capacidad} onChange={set('capacidad')} />
            </div>
          </div>
          <button type="submit" className="btn btn-gold" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar Disponibilidad'}
          </button>
        </form>
      </div>

      {/* Acceso denegado para roles sin permiso (ej. Administrador) */}
      {accessDenied && (
        <div className="alert alert-warning" style={{ maxWidth: 600, marginTop: '1rem' }}>
          <strong>Acceso restringido.</strong> La consulta de disponibilidad está disponible para Recepcionistas y Huéspedes. El perfil <strong>{auth?.rol}</strong> no tiene acceso a este módulo.
        </div>
      )}

      {/* Results */}
      {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

      {!loading && searched && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--c-text-2)' }}>
              {rooms.length > 0
                ? `${rooms.length} habitación${rooms.length !== 1 ? 'es' : ''} disponible${rooms.length !== 1 ? 's' : ''}`
                : 'Sin resultados para los filtros seleccionados'}
            </p>
          </div>

          {rooms.length > 0 ? (
            <div className="room-result-grid">
              {rooms.map((r) => (
                <div key={r.id_habitacion} className="room-result-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <span className="room-result-number">Hab. {r.numero_habitacion}</span>
                    <span className={`badge ${ESTADO_COLORS[r.estado] ?? 'badge-info'}`}>
                      {ESTADO_LABELS[r.estado] ?? r.estado}
                    </span>
                  </div>
                  <div className="room-result-meta">
                    <span className="room-result-type">{r.tipo_nombre}</span>
                    <span className="room-result-detail">Piso {r.piso} · Cap. {r.capacidad_max} personas</span>
                  </div>
                  {canQuery && (
                    <button
                      className="btn btn-outline btn-sm btn-full"
                      style={{ marginTop: '0.25rem' }}
                      onClick={() => handleReservar(r)}
                    >
                      Reservar esta habitación
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No hay habitaciones disponibles para las fechas y filtros seleccionados.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
