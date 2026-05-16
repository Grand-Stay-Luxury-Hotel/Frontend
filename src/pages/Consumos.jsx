import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const TIPOS = ['restaurante', 'lavanderia', 'spa'];

export default function Consumos() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    habitacionId:    '',
    tipo:            'restaurante',
    descripcion:     '',
    cantidad:        '',
    precio_unitario: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const total = form.cantidad && form.precio_unitario
    ? (Number(form.cantidad) * Number(form.precio_unitario)).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        habitacionId:    Number(form.habitacionId),
        tipo:            form.tipo,
        descripcion:     form.descripcion,
        cantidad:        Number(form.cantidad),
        precio_unitario: Number(form.precio_unitario),
      };
      const data = await api.consumos.registrar(payload, auth.token);
      setResult({ type: 'success', data });
      addToast('Consumo registrado exitosamente.', 'success');
      setForm({ habitacionId: '', tipo: 'restaurante', descripcion: '', cantidad: '', precio_unitario: '' });
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Consumos Adicionales</h1>
        <p>Registre los servicios adicionales consumidos durante la estadía</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Nuevo Consumo</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ID de Habitación</label>
              <input
                type="number"
                className="form-input"
                placeholder="Número de habitación (ID)"
                min="1"
                value={form.habitacionId}
                onChange={set('habitacionId')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de servicio</label>
              <select className="form-select" value={form.tipo} onChange={set('tipo')} required>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Cena para 2 personas — Menú degustación"
                value={form.descripcion}
                onChange={set('descripcion')}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input type="number" className="form-input" placeholder="1" min="1" value={form.cantidad} onChange={set('cantidad')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Precio unitario (USD)</label>
                <input type="number" className="form-input" placeholder="0.00" min="0.01" step="0.01" value={form.precio_unitario} onChange={set('precio_unitario')} required />
              </div>
            </div>

            {total && (
              <div className="alert alert-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total calculado:</span>
                <strong style={{ fontSize: '1.1rem' }}>${total}</strong>
              </div>
            )}

            {result?.type === 'success' && (
              <div className="alert alert-success">
                ✓ Consumo registrado.
                {result.data.total !== undefined && <> Total: <strong>${result.data.total}</strong></>}
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrar Consumo'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {[
            { tipo: 'Restaurante', icon: '🍽️', desc: 'Alimentos, bebidas y menús especiales.' },
            { tipo: 'Spa',        icon: '💆', desc: 'Masajes, tratamientos y terapias.' },
            { tipo: 'Lavandería', icon: '👔', desc: 'Lavado, planchado y cuidado de prendas.' },
          ].map((s) => (
            <div key={s.tipo} className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-gold)', marginBottom: '0.25rem' }}>{s.tipo}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--c-text-2)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
