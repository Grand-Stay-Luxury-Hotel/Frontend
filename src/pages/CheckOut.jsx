import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function CheckOut() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [reservaId, setReservaId] = useState('');
  const [tokenPago, setTokenPago] = useState('tok_visa_xxxx');
  const [preview, setPreview]     = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [reservasCheckout, setReservasCheckout] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);

  const cargarReservasCheckout = useCallback(async () => {
    if (!auth.token) return;
    setLoadingReservas(true);
    try {
      const res = await api.reservas.listarParaCheckout(auth.token);
      const data = Array.isArray(res) ? res : res?.data ?? [];
      setReservasCheckout(data);
    } catch (err) {
      setReservasCheckout([]);
      addToast(err.message || 'No se pudieron cargar las reservas para check-out.', 'error');
    } finally {
      setLoadingReservas(false);
    }
  }, [addToast, auth.token]);

  useEffect(() => {
    cargarReservasCheckout();
  }, [cargarReservasCheckout]);

  const printCheckoutFactura = (data) => {
    const win = window.open('', '_blank', 'width=620,height=520');
    
    const facturaNum = data.factura_electronica?.numero_factura ?? 'N/D';
    const subtotal = data.resumen_factura?.subtotal ?? 0;
    const impuestos = data.resumen_factura?.impuestos ?? 0;
    const total = data.resumen_factura?.total ?? 0;
    const anticipo = data.resumen_factura?.anticipo_pagado ?? 0;
    const saldo = data.resumen_factura?.saldo_cobrado ?? 0;
    const resId = data.factura_electronica?.id_reserva ?? '—';

    win.document.write(`<!DOCTYPE html><html><head><title>Factura Check-Out</title>
    <style>
      body{font-family:Georgia,serif;padding:2cm;color:#111;line-height:1.5;}
      h1{font-size:1.6rem;margin:0 0 0.25rem;color:#c9a96e;font-family:'Times New Roman',Times,serif;text-transform:uppercase;letter-spacing:0.05em;}
      .sub{color:#666;font-size:0.9rem;margin-bottom:1.5rem;text-transform:uppercase;letter-spacing:0.1em;}
      table{width:100%;border-collapse:collapse;margin-top:1rem;}
      td{padding:0.6rem 0;border-bottom:1px solid #eee;font-size:0.9rem;}
      td:first-child{color:#555;width:60%;}
      td:last-child{font-weight:600;text-align:right;font-family:monospace;font-size:0.95rem;}
      .total-row td{font-size:1.05rem;font-weight:700;border-top:2px solid #111;border-bottom:none;padding-top:0.75rem;color:#111;}
      .footer{margin-top:2.5rem;font-size:0.78rem;color:#999;border-top:1px solid #ddd;padding-top:0.75rem;text-align:center;}
    </style></head><body>
    <h1>Grand Stay Hotels</h1>
    <div class="sub">Factura de Check-Out</div>
    <table>
      <tr><td>N° de Factura</td><td>${facturaNum}</td></tr>
      <tr><td>Reserva N°</td><td>${resId}</td></tr>
      <tr><td>Subtotal</td><td>$${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Impuestos (19% IVA)</td><td>$${impuestos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Anticipo pagado</td><td>$${anticipo.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>
      <tr class="total-row"><td>Total facturado (COP)</td><td>$${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Saldo liquidado (Cobrado)</td><td>$${saldo.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>
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
      const saldo = preview?.resumen_factura?.saldo_cobrado ?? preview?.saldo_pendiente ?? null;
      if (Number(saldo ?? 1) > 0 && !tokenPago.trim()) {
        addToast('Ingrese un token de pago para cobrar el saldo pendiente.', 'warning');
        setLoading(false);
        return;
      }
      const payload = {
        token_pago: Number(saldo ?? 1) > 0 ? tokenPago.trim() : undefined,
      };
      const data = await api.checkout.registrar(reservaId, auth.token, payload);
      setResult({ type: 'success', data });
      addToast('Check-out registrado y liquidación completada.', 'success');
      setPreview(null);
      setReservaId('');
      setTokenPago('tok_visa_xxxx');
      await cargarReservasCheckout();
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });

  const parseDateSafe = (valor) => {
    if (!valor) return null;

    if (valor instanceof Date) {
      if (isNaN(valor.getTime())) return null;
      return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
    }

    const str = String(valor).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    }

    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return null;
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  };

  const calcularNoches = (entrada, salida) => {
    if (!entrada || !salida) return 0;
    const diff = salida - entrada;
    if (diff <= 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const dateEntrada = preview ? parseDateSafe(preview.fecha_entrada) : null;
  const dateSalida = preview ? parseDateSafe(preview.fecha_salida) : null;
  const nights = calcularNoches(dateEntrada, dateSalida);
  const nightsTotal = preview?.resumen_factura?.tarifa_base;
  const ratePerNight = nights > 0 && nightsTotal !== undefined ? (nightsTotal / nights) : undefined;
  const advancePaid = preview?.resumen_factura?.anticipo_pagado;

  return (
    <>
      <div className="page-header">
        <h1>Registro de Check-Out</h1>
        <p>Procese la salida del huésped y realice la liquidación final de la estadía</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Formulario ──────────────────────────── */}
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

            <div className="form-group">
              <label className="form-label">Token de pago para saldo pendiente</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. tok_visa_xxxx"
                value={tokenPago}
                onChange={(e) => { setTokenPago(e.target.value); setResult(null); }}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.35rem' }}>
                Use un token válido para cobrar el saldo. Tokens con “rechazado” o “fail” simulan rechazo de la pasarela.
              </p>
            </div>

            {result?.type === 'success' && (
              <div className="alert alert-success">
                <strong>Check-out completado con éxito.</strong>
                {result.data.resumen_factura?.total !== undefined && (
                  <div style={{ marginTop: '0.5rem' }}>
                    Total facturado: <strong>${fmt(result.data.resumen_factura.total)} COP</strong>
                    {result.data.resumen_factura.saldo_cobrado !== undefined && (
                      <> · Saldo cobrado: <strong>${fmt(result.data.resumen_factura.saldo_cobrado)} COP</strong></>
                    )}
                    {result.data.resumen_factura.anticipo_pagado !== undefined && (
                      <> · Anticipo deducido: <strong>${fmt(result.data.resumen_factura.anticipo_pagado)} COP</strong></>
                    )}
                  </div>
                )}
                {result.data.factura_electronica?.numero_factura && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                    N° Factura: <strong>{result.data.factura_electronica.numero_factura}</strong>
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

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Reservas en curso</p>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Listas para check-out</h2>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={cargarReservasCheckout}
              disabled={loadingReservas}
            >
              {loadingReservas ? 'Cargando…' : 'Actualizar'}
            </button>
          </div>

          {loadingReservas ? (
            <div style={{ padding: '1rem 0', color: 'var(--c-text-2)' }}>Cargando reservas en curso…</div>
          ) : reservasCheckout.length === 0 ? (
            <div className="alert alert-info">
              No hay reservas en curso listas para check-out.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {reservasCheckout.map((reserva) => (
                <div
                  key={reserva.id_reserva}
                  style={{
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-md)',
                    padding: '0.9rem',
                    background: 'var(--c-surface-2)',
                    display: 'grid',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        Reserva #{reserva.id_reserva}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', color: 'var(--c-text-2)', fontSize: '0.8rem' }}>
                        {reserva.codigo_confirmacion || 'Sin código'} · Hab. {reserva.numero_habitacion ?? reserva.numero ?? 'N/D'}
                      </p>
                    </div>
                    <span className="badge badge-success">En curso</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', color: 'var(--c-text-2)', fontSize: '0.78rem' }}>
                    <span>Huésped: {reserva.huesped_nombre || 'N/D'}</span>
                    <span>Documento: {reserva.huesped_documento || 'N/D'}</span>
                    <span>Entrada: {reserva.fecha_entrada || 'N/D'}</span>
                    <span>Salida: {reserva.fecha_salida || 'N/D'}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-gold btn-sm"
                    onClick={() => {
                      setReservaId(String(reserva.id_reserva));
                      setResult(null);
                      setPreview(null);
                    }}
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Preview de liquidación ───────────────── */}
        {preview && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Resumen de Liquidación</p>
            <span className="gold-line" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                ['Noches', (nights > 0) ? nights : (dateEntrada && dateSalida ? nights : '—')],
                ['Tarifa por noche', ratePerNight !== undefined ? `$${fmt(ratePerNight)}` : '—'],
                ['Total noches', nightsTotal !== undefined ? `$${fmt(nightsTotal)}` : '—'],
                ['Consumos adicionales', preview.total_consumos !== undefined ? `$${fmt(preview.total_consumos)}` : '$0,00'],
                ['Anticipo pagado', advancePaid != null ? `$${fmt(advancePaid)}` : (preview?.resumen_factura ? '$0,00' : '—')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--c-border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--c-text-2)' }}>{label}</span>
                  <span style={{ color: 'var(--c-text)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0.4rem', fontSize: '1rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--c-text)' }}>Total a cobrar</span>
                <span style={{ color: 'var(--c-gold)' }}>
                  {(() => {
                    const saldo = preview?.resumen_factura?.saldo_cobrado ?? preview?.saldo_pendiente;
                    const totalFact = preview?.resumen_factura?.total ?? preview?.total_facturado;
                    if (saldo !== undefined && saldo !== null) return `$${fmt(saldo)}`;
                    if (totalFact !== undefined && totalFact !== null) return `$${fmt(totalFact)}`;
                    return '—';
                  })()}
                </span>
              </div>
            </div>
            {preview.consumos && preview.consumos.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Detalle de consumos
                </p>
                {preview.consumos.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid var(--c-border)' }}>
                    <span style={{ color: 'var(--c-text-2)' }}>{c.servicio_nombre ?? c.nombre ?? c.descripcion ?? c.notas ?? '—'}</span>
                    <span style={{ color: 'var(--c-text)' }}>${fmt(c.subtotal ?? c.precio_total ?? (Number(c.cantidad ?? 1) * Number(c.precio_unitario ?? 0)))}</span>
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
