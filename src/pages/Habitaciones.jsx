import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { ESTADOS_HABITACION as ESTADOS } from '../utils/estados.js';

const TRANSICIONES = {
  disponible: ['ocupada', 'mantenimiento', 'bloqueada'],
  ocupada: ['limpieza', 'mantenimiento'],
  limpieza: ['disponible', 'mantenimiento'],
  mantenimiento: ['disponible', 'limpieza'],
  bloqueada: ['disponible', 'mantenimiento'],
};

function normalizarRol(rol) {
  return String(rol ?? '').replace(/\s+/g, '').toLowerCase();
}

function puedeCambiarA(estadoActual, estadoNuevo, rol) {
  const rolNormalizado = normalizarRol(rol);
  const esAdmin = ['administrador', 'admin'].includes(rolNormalizado);
  const esRecepcion = rolNormalizado === 'recepcionista';
  const esLimpieza = ['personallimpieza', 'limpieza'].includes(rolNormalizado);
  const esTecnico = ['serviciotecnico', 'serviciotecnico'].includes(rolNormalizado);

  if (!TRANSICIONES[estadoActual]?.includes(estadoNuevo)) return false;
  if (estadoActual === 'limpieza' && estadoNuevo === 'disponible') return esLimpieza || esAdmin;
  if (estadoNuevo === 'bloqueada') return esRecepcion || esAdmin;
  if (estadoNuevo === 'mantenimiento') return esRecepcion || esAdmin || esTecnico;
  if (estadoActual === 'mantenimiento') return esRecepcion || esAdmin || esTecnico;
  if (estadoActual === 'ocupada' && estadoNuevo === 'limpieza') return esRecepcion || esAdmin;
  if (estadoActual === 'disponible' && estadoNuevo === 'ocupada') return esRecepcion || esAdmin;
  return esAdmin || esRecepcion || esLimpieza || esTecnico;
}

export default function Habitaciones() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [habitaciones, setHabitaciones] = useState([]);
  const [loadingHabs, setLoadingHabs] = useState(true);

  const [form, setForm] = useState({ numero: '', estado: 'limpieza', observaciones: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectedRoom = habitaciones.find((h) => String(h.numero_habitacion ?? h.numero ?? '') === String(form.numero));
  const estadosPermitidos = selectedRoom
    ? ESTADOS.filter((e) => puedeCambiarA(selectedRoom.estado, e.value, auth?.rol))
    : ESTADOS.filter((e) => e.value !== 'ocupada');

  const cargar = useCallback(async () => {
    setLoadingHabs(true);
    try {
      const res = await api.habitaciones.listar(auth.token);
      setHabitaciones(res.data ?? res);
    } catch {
      addToast('No se pudieron cargar las habitaciones.', 'error');
    } finally {
      setLoadingHabs(false);
    }
  }, [auth.token, addToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  useEffect(() => {
    if (!selectedRoom || estadosPermitidos.length === 0) return;
    if (!estadosPermitidos.some((e) => e.value === form.estado)) {
      setForm((prev) => ({ ...prev, estado: estadosPermitidos[0].value }));
    }
  }, [selectedRoom, estadosPermitidos, form.estado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero) { addToast('Ingrese el número de habitación.', 'warning'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.habitaciones.estadoPorNumero(
        form.numero,
        form.estado,
        auth.token,
        form.observaciones,
      );
      setResult({ type: 'success', data, estado: form.estado, numero: form.numero });
      addToast(`Hab. ${form.numero} actualizada a "${form.estado}".`, 'success');
      setForm({ numero: '', estado: 'limpieza', observaciones: '' });
      await cargar();
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const badgeCls = ESTADOS.find((e) => e.value === form.estado)?.badge ?? 'badge-info';

  return (
    <>
      <div className="page-header">
        <h1>Estado de Habitaciones</h1>
        <p>Actualice el estado operativo de las habitaciones del hotel</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800 }}>
        {/* â”€â”€ Formulario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Actualizar Estado</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Número de Habitación</label>
              {loadingHabs ? (
                <input className="form-input" placeholder="Cargando habitaciones..." disabled />
              ) : (
                <select className="form-select" value={form.numero} onChange={set('numero')} required>
                  <option value="">— Seleccione una habitación —</option>
                  {habitaciones.map((h) => {
                    const numeroHabitacion = h.numero_habitacion ?? h.numero ?? '';
                    return (
                      <option key={h.id_habitacion} value={numeroHabitacion}>
                        Hab. {numeroHabitacion} · {h.tipo_nombre} · Piso {h.piso} · {h.estado}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Estado</label>
              <select className="form-select" value={form.estado} onChange={set('estado')} required disabled={selectedRoom && estadosPermitidos.length === 0}>
                {estadosPermitidos.map((e) => (
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

            {selectedRoom && estadosPermitidos.length === 0 && (
              <div className="alert alert-error">
                No hay transiciones permitidas para su rol desde el estado actual "{selectedRoom.estado}".
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
                ✓ Hab. {result.numero} actualizada a <strong>{result.estado}</strong>
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading || (selectedRoom && estadosPermitidos.length === 0)}>
              {loading ? 'Actualizando…' : 'Actualizar Estado'}
            </button>
          </form>
        </div>

        {/* â”€â”€ Guía de estados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Mapa de habitaciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ marginTop: '2rem', maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p className="eyebrow">Mapa de Habitaciones</p>
          <button className="btn btn-ghost btn-sm" onClick={cargar} disabled={loadingHabs}>
            {loadingHabs ? 'Actualizando…' : '↻ Actualizar'}
          </button>
        </div>
        {loadingHabs ? (
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.85rem' }}>Cargando habitaciones...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {habitaciones.map((h) => {
              const meta = ESTADOS.find((e) => e.value === h.estado);
              const numeroHabitacion = h.numero_habitacion ?? h.numero ?? '';
              const isSelected = form.numero === String(numeroHabitacion);
              return (
                <button
                  key={h.id_habitacion}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, numero: String(numeroHabitacion) }))}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '0.85rem',
                    outline: isSelected ? '2px solid var(--c-gold)' : 'none',
                    transition: 'outline 0.15s',
                  }}
                  title="Seleccionar habitación"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'var(--f-heading)', fontSize: '1.15rem', color: 'var(--c-text)', fontWeight: 700 }}>{numeroHabitacion}</span>
                    <span className={`badge ${meta?.badge ?? 'badge-gold'}`} style={{ fontSize: '0.58rem' }}>
                      {meta?.label ?? h.estado}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', margin: 0 }}>{h.tipo_nombre}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--c-text-3)', margin: 0 }}>Piso {h.piso}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
