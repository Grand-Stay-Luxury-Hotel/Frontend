import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function CheckIn() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  // Backend actual: check-in solo por id de reserva
  const [modo, setModo] = useState('id');
  const [reservaId, setReservaId] = useState('');
  const [codigoConfirmacion, setCodigoConfirmacion] = useState('');
  const [form, setForm] = useState({ documento_verificado: true, observaciones: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const printCheckinVoucher = (data) => {
    const win = window.open('', '_blank', 'width=620,height=520');
    const hora = data.hora_entrada ? new Date(data.hora_entrada).toLocaleString('es-CO') : 'N/D';
    win.document.write(`<!DOCTYPE html><html><head><title>Voucher Check-In</title>
    <style>
      body{font-family:Georgia,serif;padding:2cm;color:#111;}
      h1{font-size:1.5rem;margin:0 0 0.25rem;}
      .sub{color:#666;font-size:0.95rem;margin-bottom:1.5rem;}
      .code-wrap{border:2px solid #9a7540;border-radius:6px;padding:0.75rem 1.25rem;display:inline-block;margin:1rem 0;}
      .code{font-size:2rem;font-weight:bold;letter-spacing:0.2em;color:#9a7540;font-family:Georgia,serif;}
      .code-label{font-size:0.78rem;color:#666;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.3rem;}
      table{width:100%;border-collapse:collapse;margin-top:1.5rem;}
      td{padding:0.45rem 0;border-bottom:1px solid #eee;font-size:0.9rem;}
      td:first-child{color:#555;width:45%;}
      td:last-child{font-weight:600;}
      .footer{margin-top:2rem;font-size:0.78rem;color:#999;border-top:1px solid #ddd;padding-top:0.75rem;}
    </style></head><body>
    <h1>Grand Stay Hotels</h1>
    <div class="sub">Comprobante de Check-In</div>
    <div class="code-wrap">
      <div class="code-label">Código de acceso a la habitación</div>
      <div class="code">${data.codigo_acceso ?? 'N/D'}</div>
    </div>
    <table>
      <tr><td>Registro N°</td><td>${data.id_checkin ?? 'N/D'}</td></tr>
      <tr><td>Reserva N°</td><td>${data.id_reserva ?? 'N/D'}</td></tr>
      <tr><td>Hora de entrada</td><td>${hora}</td></tr>
    </table>
    <div class="footer">Conserve este comprobante durante su estadía. Grand Stay Hotels &mdash; Atención al huésped 24h.</div>
    <script>window.focus();window.print();window.close();</script>
    </body></html>`);
    win.document.close();
  };

  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [f]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      documento_verificado: form.documento_verificado,
      observaciones: form.observaciones || undefined,
    };
    setLoading(true);
    setResult(null);
    try {
      let data;
      if (modo === 'codigo') {
        if (!codigoConfirmacion.trim()) { addToast('Ingrese el código de confirmación.', 'warning'); setLoading(false); return; }
        data = await api.checkin.registrarPorCodigo(codigoConfirmacion.trim(), auth.token);
      } else {
        if (!reservaId) { addToast('Ingrese el ID de la reserva.', 'warning'); setLoading(false); return; }
        data = await api.checkin.registrar(reservaId, payload, auth.token);
      }
      setResult({ type: 'success', data });
      addToast('Check-in registrado exitosamente.', 'success');
      setReservaId('');
      setCodigoConfirmacion('');
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

          {/* Tabs modo */}
          <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
            {[{ key: 'id', label: 'Por N° de Reserva' }].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setModo(m.key); setResult(null); }}
                style={{
                  flex: 1, padding: '0.5rem 0.75rem', border: 'none', borderRadius: 'var(--r-sm)',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  background: modo === m.key ? 'var(--c-gold)' : 'var(--c-surface-3)',
                  color: modo === m.key ? '#070707' : 'var(--c-text-2)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginBottom: '1rem' }}>
            Puede ingresar el ID o el código de confirmación de la reserva.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {modo === 'codigo' ? (
              <div className="form-group">
                <label className="form-label">Código de Confirmación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. GS-2025-ABCD"
                  value={codigoConfirmacion}
                  onChange={(e) => { setCodigoConfirmacion(e.target.value); setResult(null); }}
                  required
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.35rem' }}>
                  Código que el huésped recibió al confirmar su reserva.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">ID o código de reserva</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 42 o GS-2025-000002"
                  value={reservaId}
                  onChange={(e) => { setReservaId(e.target.value); setResult(null); }}
                  required
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.35rem' }}>
                  Código o número de reserva generado al realizar la reserva. Consultélo en el módulo de{' '}
                  <Link to="/dashboard/reservas" style={{ color: 'var(--c-gold)' }}>Reservas</Link>.
                </p>
              </div>
            )}

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
              <div className="alert alert-success" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span>✓ {result.data.mensaje ?? 'Check-in registrado correctamente.'}</span>
                {result.data.codigo_acceso && (
                  <div style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid var(--c-gold-border)', borderRadius: 'var(--r-md)', padding: '0.6rem 0.9rem', marginTop: '0.25rem' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Código de acceso a la habitación</p>
                    <p style={{ fontSize: '1.4rem', fontFamily: 'var(--f-heading)', color: 'var(--c-gold-light)', letterSpacing: '0.15em', fontWeight: 700 }}>{result.data.codigo_acceso}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', marginTop: '0.2rem' }}>Entregue este código al huésped para acceder a su habitación.</p>
                  </div>
                )}
                {result.data.id_checkin && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>
                    Registro N° {result.data.id_checkin} · Entrada:{' '}
                    {result.data.hora_entrada ? new Date(result.data.hora_entrada).toLocaleString('es-CO') : ''}
                  </span>
                )}
              </div>
            )}
            {result?.type === 'success' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => printCheckinVoucher(result.data)}
              >
                ↓ Imprimir comprobante de check-in
              </button>
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
