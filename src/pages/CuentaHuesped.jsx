import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const ESTADO_CLASS = {
  confirmada:  'badge-success',
  pendiente:   'badge-warning',
  cancelada:   'badge-error',
  completada:  'badge-info',
  checkin:     'badge-gold',
  checkout:    'badge-info',
};

export default function CuentaHuesped() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('reservas');

  useEffect(() => {
    api.cuenta.obtener(auth.token)
      .then((res) => setData(res.data ?? res))
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [auth.token, addToast]);

  const fmt = (n) => Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

  const TABS = [
    { id: 'reservas',  label: 'Mis Reservas' },
    { id: 'consumos',  label: 'Consumos' },
    { id: 'facturas',  label: 'Facturas' },
    { id: 'resumen',   label: 'Resumen' },
  ];

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <div className="page-header">
          <h1>Mi Cuenta</h1>
        </div>
        <div className="empty-state">
          <p>No se pudo cargar la información de la cuenta.</p>
        </div>
      </>
    );
  }

  const { huesped, reservas = [], consumos = [], facturas = [], resumen = {} } = data;

  return (
    <>
      <div className="page-header">
        <h1>Mi Cuenta</h1>
        <p>Bienvenido, {huesped?.nombre_completo ?? auth.nombre}</p>
      </div>

      {/* Perfil */}
      <div className="card card-gold" style={{ marginBottom: '1.75rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--c-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Perfil</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text)' }}>{huesped?.nombre_completo}</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)' }}>{huesped?.email}</p>
          {huesped?.documento_identidad && (
            <p style={{ fontSize: '0.78rem', color: 'var(--c-text-3)' }}>Doc: {huesped.documento_identidad}</p>
          )}
          {huesped?.telefono && (
            <p style={{ fontSize: '0.78rem', color: 'var(--c-text-3)' }}>Tel: {huesped.telefono}</p>
          )}
        </div>
        {resumen && (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Reservas totales', value: resumen.total_reservas ?? reservas.length },
              { label: 'Noches hospedado', value: resumen.total_noches ?? '—' },
              { label: 'Total gastado', value: resumen.total_gastado != null ? `$${fmt(resumen.total_gastado)}` : '—' },
            ].map((k) => (
              <div key={k.label} style={{ textAlign: 'center', minWidth: 100 }}>
                <p style={{ fontSize: '1.35rem', fontFamily: 'var(--f-heading)', color: 'var(--c-gold)', fontWeight: 700 }}>{k.value}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.2rem' }}>{k.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--c-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.6rem 1.25rem', fontSize: '0.78rem', fontWeight: 500,
              letterSpacing: '0.06em', background: 'none', cursor: 'pointer',
              color: tab === t.id ? 'var(--c-gold)' : 'var(--c-text-2)',
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--c-gold)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RESERVAS ─────────────────────────────────── */}
      {tab === 'reservas' && (
        reservas.length === 0
          ? <div className="empty-state"><p>No tienes reservas registradas.</p></div>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Reserva</th>
                    <th>Habitación</th>
                    <th>Tipo</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Estado</th>
                    <th>Total (COP)</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id_reserva}>
                      <td>#{r.id_reserva}</td>
                      <td>{r.numero_habitacion ?? '—'}</td>
                      <td>{r.tipo_habitacion ?? r.tipo ?? '—'}</td>
                      <td>{fmtDate(r.fecha_inicio ?? r.fecha_entrada)}</td>
                      <td>{fmtDate(r.fecha_fin ?? r.fecha_salida)}</td>
                      <td>
                        <span className={`badge ${ESTADO_CLASS[r.estado] ?? 'badge-info'}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td>${fmt(r.precio_total ?? r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ── CONSUMOS ─────────────────────────────────── */}
      {tab === 'consumos' && (
        consumos.length === 0
          ? <div className="empty-state"><p>No hay consumos adicionales registrados.</p></div>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Reserva</th>
                    <th>Servicio</th>
                    <th>Cantidad</th>
                    <th>Total (COP)</th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((c, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(c.fecha)}</td>
                      <td>#{c.id_reserva}</td>
                      <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{c.nombre_servicio ?? c.descripcion}</td>
                      <td>{c.cantidad}</td>
                      <td>${fmt(c.precio_total ?? c.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ── FACTURAS ─────────────────────────────────── */}
      {tab === 'facturas' && (
        facturas.length === 0
          ? <div className="empty-state"><p>No hay facturas emitidas.</p></div>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Reserva</th>
                    <th>Fecha</th>
                    <th>Total (COP)</th>
                    <th>Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--c-gold)', fontWeight: 500 }}>{f.codigo_factura ?? f.id_factura}</td>
                      <td>#{f.id_reserva}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(f.fecha_emision ?? f.fecha)}</td>
                      <td>${fmt(f.total_facturado ?? f.total)}</td>
                      <td>
                        {f.saldo_pendiente != null
                          ? <span className={`badge ${Number(f.saldo_pendiente) > 0 ? 'badge-warning' : 'badge-success'}`}>${fmt(f.saldo_pendiente)}</span>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ── RESUMEN ──────────────────────────────────── */}
      {tab === 'resumen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxWidth: 700 }}>
          {[
            { label: 'Reservas totales',    value: resumen.total_reservas ?? reservas.length },
            { label: 'Reservas activas',    value: resumen.reservas_activas ?? reservas.filter((r) => ['confirmada', 'checkin'].includes(r.estado)).length },
            { label: 'Noches hospedado',    value: resumen.total_noches ?? '—' },
            { label: 'Consumos totales',    value: resumen.total_consumos ?? consumos.length },
            { label: 'Total gastado (COP)', value: resumen.total_gastado != null ? `$${fmt(resumen.total_gastado)}` : '—' },
            { label: 'Facturas emitidas',   value: facturas.length },
          ].map((k) => (
            <div key={k.label} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <p style={{ fontSize: '1.5rem', fontFamily: 'var(--f-heading)', color: 'var(--c-gold)', fontWeight: 700, marginBottom: '0.4rem' }}>
                {k.value}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-text-2)' }}>{k.label}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
