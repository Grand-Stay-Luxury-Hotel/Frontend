import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function CheckIn() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [reservaId, setReservaId] = useState('');
  const [form, setForm] = useState({ documento_verificado: true, observaciones: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [f]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reservaId) { addToast('Ingrese el ID de la reserva.', 'warning'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.checkin.registrar(reservaId, {
        documento_verificado: form.documento_verificado,
        observaciones: form.observaciones || undefined,
      }, auth.token);
      setResult({ type: 'success', data });
      addToast('Check-in registrado exitosamente.', 'success');
      setReservaId('');
      setForm({ documento_verificado: true, observaciones: '' });
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
        <h1>Registro de Check-In</h1>
        <p>Confirme la llegada del huésped y registre su entrada al hotel</p>
      </div>

      <div style={{ maxWidth: 540 }}>
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Datos del Check-In</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ID de Reserva</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej. 1042"
                min="1"
                value={reservaId}
                onChange={(e) => { setReservaId(e.target.value); setResult(null); }}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="docVerif"
                checked={form.documento_verificado}
                onChange={set('documento_verificado')}
                style={{ width: 16, height: 16, accentColor: 'var(--c-gold)', cursor: 'pointer' }}
              />
              <label htmlFor="docVerif" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                Documento de identidad verificado
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones (opcional)</label>
              <textarea
                className="form-textarea"
                placeholder="Notas adicionales sobre el check-in…"
                value={form.observaciones}
                onChange={set('observaciones')}
              />
            </div>

            {result?.type === 'success' && (
              <div className="alert alert-success">
                ✓ Check-in registrado correctamente.
                {result.data.id_checkin && <span> ID Check-in: <strong>{result.data.id_checkin}</strong></span>}
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrar Check-In'}
            </button>
          </form>
        </div>

        <div className="card-gold card" style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Checklist de Check-In
          </p>
          {[
            'Verificar documento de identidad del huésped',
            'Confirmar que la habitación está lista',
            'Entregar llaves o tarjetas de acceso',
            'Informar horario de check-out y servicios disponibles',
            'Registrar el check-in en el sistema',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.4rem 0', borderBottom: '1px solid var(--c-border)' }}>
              <span style={{ color: 'var(--c-gold)', fontSize: '0.85rem', marginTop: '0.05rem' }}>✓</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--c-text-2)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
