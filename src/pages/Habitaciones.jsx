import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const ESTADOS = [
  { value: 'disponible',    label: 'Disponible',    badge: 'badge-success' },
  { value: 'ocupada',       label: 'Ocupada',        badge: 'badge-error'   },
  { value: 'limpieza',      label: 'En Limpieza',    badge: 'badge-warning' },
  { value: 'mantenimiento', label: 'Mantenimiento',  badge: 'badge-info'    },
  { value: 'bloqueada',     label: 'Bloqueada',      badge: 'badge-gold'    },
];

export default function Habitaciones() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [tab, setTab] = useState('listado');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [habitaciones, setHabitaciones] = useState([]);
  const [habitacionesLoading, setHabitacionesLoading] = useState(false);
  const [habitacionesLoaded, setHabitacionesLoaded] = useState(false);
  const [form, setForm] = useState({ numero: '', estado: 'limpieza', observaciones: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const loadHabitaciones = useCallback(async () => {
    setHabitacionesLoading(true);
    try {
      const data = await api.habitaciones.listar(auth.token);
      setHabitaciones(data.habitaciones ?? []);
      setHabitacionesLoaded(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setHabitacionesLoading(false);
    }
  }, [auth.token, addToast]);

  useEffect(() => {
    if (tab === 'listado' && !habitacionesLoaded) {
      loadHabitaciones();
    }
  }, [tab, habitacionesLoaded, loadHabitaciones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero) { addToast('Ingrese el numero de la habitacion.', 'warning'); return; }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        estado: form.estado,
        ...(form.observaciones ? { observaciones: form.observaciones } : {}),
      };
      const data = await api.habitaciones.estado(form.numero, payload, auth.token);
      setResult({ type: 'success', data, estado: form.estado });
      addToast(`Estado actualizado a "${form.estado}".`, 'success');
      setForm({ numero: '', estado: 'limpieza', observaciones: '' });
      loadHabitaciones();
      setTab('listado');
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const badgeCls = ESTADOS.find((e) => e.value === form.estado)?.badge ?? 'badge-info';
  const resumen = useMemo(() => ({
    total: habitaciones.length,
    disponible: habitaciones.filter((h) => h.estado === 'disponible').length,
    ocupada: habitaciones.filter((h) => h.estado === 'ocupada').length,
    limpieza: habitaciones.filter((h) => h.estado === 'limpieza').length,
    mantenimiento: habitaciones.filter((h) => h.estado === 'mantenimiento').length,
    bloqueada: habitaciones.filter((h) => h.estado === 'bloqueada').length,
  }), [habitaciones]);

  const habitacionesFiltradas = useMemo(() => {
    if (estadoFiltro === 'todos') return habitaciones;
    return habitaciones.filter((h) => h.estado === estadoFiltro);
  }, [habitaciones, estadoFiltro]);

  const prepararCambio = (habitacion) => {
    setForm({ numero: String(habitacion.numero_habitacion), estado: habitacion.estado === 'ocupada' ? 'limpieza' : 'disponible', observaciones: '' });
    setResult(null);
    setTab('actualizar');
  };

  const tabs = [
    { id: 'listado', label: 'Ver Habitaciones' },
    { id: 'actualizar', label: 'Actualizar Estado' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Estado de Habitaciones</h1>
        <p>Visualice el estado operativo de todas las habitaciones y gestione sus cambios</p>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--c-border)', paddingBottom: 0 }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: tab === item.id ? 'var(--c-gold)' : 'var(--c-text-2)',
              borderBottom: tab === item.id ? '2px solid var(--c-gold)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'listado' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value" style={{ fontSize: '1.5rem' }}>{resumen.total}</span></div>
            <div className="stat-card"><span className="stat-label">Disponibles</span><span className="stat-value" style={{ fontSize: '1.5rem' }}>{resumen.disponible}</span></div>
            <div className="stat-card"><span className="stat-label">Ocupadas</span><span className="stat-value" style={{ fontSize: '1.5rem' }}>{resumen.ocupada}</span></div>
            <div className="stat-card"><span className="stat-label">Limpieza</span><span className="stat-value" style={{ fontSize: '1.5rem' }}>{resumen.limpieza}</span></div>
            <div className="stat-card"><span className="stat-label">Fuera de servicio</span><span className="stat-value" style={{ fontSize: '1.5rem' }}>{resumen.mantenimiento + resumen.bloqueada}</span></div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>Listado de Habitaciones</p>
                <span className="gold-line" style={{ margin: 0 }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ minWidth: 180, height: 36, fontSize: '0.78rem' }}
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                >
                  <option value="todos">Todas</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                  ))}
                </select>
                <button className="btn btn-outline btn-sm" onClick={loadHabitaciones} disabled={habitacionesLoading}>
                  {habitacionesLoading ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--c-text-2)' }}>Filtro activo:</span>
              <span className={`badge ${estadoFiltro === 'todos' ? 'badge-info' : (ESTADOS.find((e) => e.value === estadoFiltro)?.badge ?? 'badge-info')}`}>
                {estadoFiltro === 'todos' ? 'Todas las habitaciones' : (ESTADOS.find((e) => e.value === estadoFiltro)?.label ?? 'Todos')}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--c-text-2)' }}>
                Mostrando {habitacionesFiltradas.length} de {habitaciones.length}
              </span>
            </div>

            {habitacionesLoading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : habitacionesFiltradas.length === 0 ? (
              <div className="empty-state"><p>No hay habitaciones para mostrar.</p></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Habitación</th>
                      <th>Tipo</th>
                      <th>Piso</th>
                      <th>Capacidad</th>
                      <th>Estado</th>
                      <th>Reserva</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {habitacionesFiltradas.map((habitacion) => {
                      const meta = ESTADOS.find((e) => e.value === habitacion.estado) ?? ESTADOS[0];
                      return (
                        <tr key={habitacion.numero_habitacion}>
                          <td>
                            <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>Hab. {habitacion.numero_habitacion}</div>
                          </td>
                          <td>{habitacion.tipo_nombre}</td>
                          <td>{habitacion.piso}</td>
                          <td>{habitacion.capacidad_max}</td>
                          <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                          <td>
                            <span className={`badge ${habitacion.activo ? 'badge-success' : 'badge-warning'}`}>
                              {habitacion.activo ? 'Disponible para reservas' : 'Bloquea reservas'}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => prepararCambio(habitacion)}>
                              Cambiar estado
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'actualizar' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 900 }}>
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Actualizar Estado</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Numero de Habitacion</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. 101"
                value={form.numero}
                onChange={set('numero')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Estado</label>
              <select className="form-select" value={form.estado} onChange={set('estado')} required>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            {form.estado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-2)' }}>Estado seleccionado:</span>
                <span className={`badge ${badgeCls}`}>
                  {ESTADOS.find((e) => e.value === form.estado)?.label}
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Observaciones (opcional)</label>
              <textarea
                className="form-textarea"
                placeholder="Motivo del cambio, daños reportados, etc."
                value={form.observaciones}
                onChange={set('observaciones')}
              />
            </div>

            {result?.type === 'success' && (
              <div className="alert alert-success">
                ✓ Habitación {result.data.numero_habitacion ?? form.numero} → <strong>{result.estado}</strong>
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Actualizando…' : 'Actualizar Estado'}
            </button>
          </form>
        </div>

        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Guía de Estados</p>
          <span className="gold-line" />
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { estado: 'disponible',    desc: 'La habitación está lista para recibir huéspedes.' },
              { estado: 'ocupada',       desc: 'Huésped activo. No asignar a nuevas reservas.' },
              { estado: 'limpieza',      desc: 'En proceso de limpieza o preparación.' },
              { estado: 'mantenimiento', desc: 'Fuera de servicio por reparación o revisión técnica.' },
              { estado: 'bloqueada',     desc: 'Bloqueada administrativamente por gestión interna.' },
            ].map((e) => {
              const meta = ESTADOS.find((s) => s.value === e.estado);
              return (
                <div key={e.estado} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid var(--c-border)' }}>
                  <span className={`badge ${meta?.badge}`} style={{ flexShrink: 0, marginTop: '0.05rem' }}>{meta?.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>{e.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
