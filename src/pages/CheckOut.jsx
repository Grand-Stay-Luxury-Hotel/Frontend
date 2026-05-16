import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function CheckOut() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [reservaId, setReservaId] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reservaId) { addToast('Ingrese el ID de la reserva.', 'warning'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.checkout.registrar(reservaId, auth.token);
      setResult({ type: 'success', data });
      addToast('Check-out registrado y liquidación completada.', 'success');
      setReservaId('');
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
        <h1>Registro de Check-Out</h1>
        <p>Procese la salida del huésped y realice la liquidación final de la estadía</p>
      </div>

      <div style={{ maxWidth: 540 }}>
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Procesar Salida</p>
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

            {result?.type === 'success' && (
              <div className="alert alert-success">
                <strong>Check-out completado.</strong>
                {result.data.total_facturado !== undefined && (
                  <div style={{ marginTop: '0.5rem' }}>
                    Total facturado: <strong>${result.data.total_facturado}</strong>
                    {result.data.saldo_pendiente !== undefined && (
                      <> · Saldo pendiente: <strong>${result.data.saldo_pendiente}</strong></>
                    )}
                  </div>
                )}
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Procesando…' : 'Registrar Check-Out y Liquidar'}
            </button>
          </form>
        </div>

        <div className="card-gold card" style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Proceso de Check-Out
          </p>
          {[
            'Verificar que el huésped devuelva llaves y accesorios',
            'Revisar consumos pendientes (restaurante, spa, lavandería)',
            'Generar y entregar la factura final',
            'Procesar el cobro del saldo restante',
            'Actualizar el estado de la habitación a "Limpieza"',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.4rem 0', borderBottom: '1px solid var(--c-border)' }}>
              <span style={{ color: 'var(--c-gold)', fontSize: '0.85rem', marginTop: '0.05rem' }}>→</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--c-text-2)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
