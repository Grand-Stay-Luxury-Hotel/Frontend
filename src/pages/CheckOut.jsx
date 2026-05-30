import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function CheckOut() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [reservaId, setReservaId] = useState('');
  const [preview, setPreview]     = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);

  const printCheckoutFactura = (data) => {
    const win = window.open('', '_blank', 'width=620,height=520');
    const total = typeof data.total_facturado === 'number'
      ? data.total_facturado.toLocaleString('es-CO', { minimumFractionDigits: 2 })
      : data.total_facturado ?? 'N/D';
    const saldo = typeof data.saldo_pendiente === 'number'
      ? data.saldo_pendiente.toLocaleString('es-CO', { minimumFractionDigits: 2 })
      : data.saldo_pendiente ?? 'N/D';
    win.document.write(`<!DOCTYPE html><html><head><title>Factura Check-Out</title>
    <style>
      body{font-family:Georgia,serif;padding:2cm;color:#111;}
      h1{font-size:1.5rem;margin:0 0 0.25rem;}
      .sub{color:#666;font-size:0.95rem;margin-bottom:1.5rem;}
      table{width:100%;border-collapse:collapse;margin-top:1rem;}
      td{padding:0.45rem 0;border-bottom:1px solid #eee;font-size:0.9rem;}
      td:first-child{color:#555;width:55%;}
      td:last-child{font-weight:600;text-align:right;}
      .total-row td{font-size:1.05rem;font-weight:700;border-top:2px solid #111;border-bottom:none;padding-top:0.75rem;}
      .footer{margin-top:2rem;font-size:0.78rem;color:#999;border-top:1px solid #ddd;padding-top:0.75rem;}
    </style></head><body>
    <h1>Grand Stay Hotels</h1>
    <div class="sub">Factura de Check-Out</div>
    <table>
      <tr><td>N° de Factura</td><td>${data.codigo_factura ?? 'N/D'}</td></tr>
      <tr><td>Reserva N°</td><td>${reservaId}</td></tr>
      <tr class="total-row"><td>Total facturado (COP)</td><td>$${total}</td></tr>
      <tr><td>Saldo pendiente (COP)</td><td>$${saldo}</td></tr>
    </table>
    <div class="footer">Gracias por hospedarse en Grand Stay Hotels. ¡Esperamos volver a recibirle pronto!</div>
    <script>window.focus();window.print();window.close();</script>
    </body></html>`);
    win.document.close();
  };

  const handlePreview = async () => {
    if (!reservaId.trim()) { addToast('Ingrese el ID de la reserva.', 'warning'); return; }
    setLoadingPreview(true);
    setPreview(null);
    setResult(null);
    try {
      const data = await api.checkout.previo(reservaId.trim(), auth.token);
      setPreview(data.data ?? data);
    } catch (err) {
      if (err.status === 422) {
        addToast(`${err.message}. Verifique que exista una tarifa activa para las fechas de la reserva en el módulo de Tarifas.`, 'error');
      } else {
        addToast(err.message, 'error');
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reservaId) { addToast('Ingrese el ID de la reserva.', 'warning'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.checkout.registrar(reservaId, auth.token);
      setResult({ type: 'success', data });
      addToast('Check-out registrado y liquidación completada.', 'success');
      setPreview(null);
      setReservaId('');
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });

  return (
    <>
      <div className="page-header">
        <h1>Registro de Check-Out</h1>
        <p>Procese la salida del huésped y realice la liquidación final de la estadía</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: '1.5rem', maxWidth: preview ? 900 : 540 }}>
        {/* â”€â”€ Formulario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Procesar Salida</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ID o código de reserva</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 42 o GS-2025-000002"
                  value={reservaId}
                  onChange={(e) => { setReservaId(e.target.value); setResult(null); setPreview(null); }}
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handlePreview}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? '…' : 'Ver resumen'}
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.35rem' }}>
                Consulte el módulo de{' '}
                <Link to="/dashboard/reservas" style={{ color: 'var(--c-gold)' }}>Reservas</Link> para encontrar el N° de reserva.
              </p>
            </div>

            {result?.type === 'success' && (
              <div className="alert alert-success">
                <strong>Check-out completado.</strong>
                {result.data.total_facturado !== undefined && (
                  <div style={{ marginTop: '0.5rem' }}>
                    Total facturado: <strong>${fmt(result.data.total_facturado)} COP</strong>
                    {result.data.saldo_pendiente !== undefined && (
                      <> · Saldo pendiente: <strong>${fmt(result.data.saldo_pendiente)} COP</strong></>
                    )}
                  </div>
                )}
                {result.data.codigo_factura && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                    Factura: <strong>{result.data.codigo_factura}</strong>
                  </div>
                )}
              </div>
            )}
            {result?.type === 'success' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => printCheckoutFactura(result.data)}
              >
                ↓ Imprimir factura
              </button>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Procesando…' : 'Registrar Check-Out y Liquidar'}
            </button>
          </form>

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

        {/* â”€â”€ Preview de liquidación â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {preview && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Resumen de Liquidación</p>
            <span className="gold-line" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                ['Noches', preview.noches ?? '—'],
                ['Tarifa por noche', preview.tarifa_noche ? `$${fmt(preview.tarifa_noche)}` : '—'],
                ['Total noches', preview.total_noches ? `$${fmt(preview.total_noches)}` : '—'],
                ['Consumos adicionales', preview.total_consumos ? `$${fmt(preview.total_consumos)}` : '$0'],
                ['Anticipo pagado', preview.anticipo_pagado ? `$${fmt(preview.anticipo_pagado)}` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--c-border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--c-text-2)' }}>{label}</span>
                  <span style={{ color: 'var(--c-text)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0.4rem', fontSize: '1rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--c-text)' }}>Total a cobrar</span>
                <span style={{ color: 'var(--c-gold)' }}>${fmt(preview.saldo_pendiente ?? preview.total_facturado)}</span>
              </div>
            </div>
            {preview.consumos && preview.consumos.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Detalle de consumos
                </p>
                {preview.consumos.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid var(--c-border)' }}>
                    <span style={{ color: 'var(--c-text-2)' }}>{c.nombre ?? c.descripcion}</span>
                    <span style={{ color: 'var(--c-text)' }}>${fmt(c.precio_total ?? c.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
