import { useState } from 'react';
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

  const [form, setForm] = useState({ id: '', estado: 'limpieza', observaciones: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id) { addToast('Ingrese el ID de la habitación.', 'warning'); return; }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        estado: form.estado,
        ...(form.observaciones ? { observaciones: form.observaciones } : {}),
      };
      const data = await api.habitaciones.estado(form.id, payload, auth.token);
      setResult({ type: 'success', data, estado: form.estado });
      addToast(`Estado actualizado a "${form.estado}".`, 'success');
      setForm({ id: '', estado: 'limpieza', observaciones: '' });
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
        {/* Form */}
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Actualizar Estado</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ID de Habitación</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej. 101"
                min="1"
                value={form.id}
                onChange={set('id')}
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
                ✓ Habitación #{result.data.id_habitacion ?? form.id} → <strong>{result.estado}</strong>
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Actualizando…' : 'Actualizar Estado'}
            </button>
          </form>
        </div>

        {/* Estado reference card */}
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
    </>
  );
}
