import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

function money(value) {
  return Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function CuentaHuesped() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [reservaId, setReservaId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notAvailable, setNotAvailable] = useState(false);

  const loadCuenta = useCallback(async () => {
    setLoading(true);
    setNotAvailable(false);
    try {
      const params = {
        id_huesped: auth.id_huesped ?? undefined,
        id_reserva: reservaId ? Number(reservaId) : undefined,
      };
      const res = await api.cuenta.consultar(params, auth.token);
      setData(res);
    } catch (err) {
      if (err.status === 404) {
        setNotAvailable(true);
      } else {
        addToast(err.message, 'error');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [auth.id_huesped, auth.token, reservaId, addToast]);

  useEffect(() => {
    loadCuenta();
  }, [loadCuenta]);

  useEffect(() => {
    const id = setInterval(() => {
      loadCuenta();
    }, 30000);
    return () => clearInterval(id);
  }, [loadCuenta]);

  const rows = useMemo(() => {
    const list = data?.items ?? data?.cargos ?? data?.data?.items ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const totals = useMemo(() => {
    const subtotal = Number(data?.subtotal ?? data?.resumen?.subtotal ?? rows.reduce((acc, r) => acc + Number(r.subtotal ?? r.valor ?? 0), 0));
    const impuestos = Number(data?.impuestos ?? data?.resumen?.impuestos ?? 0);
    const total = Number(data?.total ?? data?.resumen?.total ?? subtotal + impuestos);
    return { subtotal, impuestos, total };
  }, [data, rows]);

  const shareLink = data?.enlace_publico ?? data?.public_url ?? data?.resumen?.enlace;

  return (
    <>
      <div className="page-header">
        <h1>Cuenta del Huésped</h1>
        <p>Consulta en tiempo real de consumos y saldo acumulado de la estadía.</p>
      </div>

      {notAvailable && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          El backend aún no expone un endpoint dedicado de cuenta del huésped. La vista frontend ya está lista.
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.8rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">ID Reserva (opcional)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              placeholder="Filtrar por reserva"
              value={reservaId}
              onChange={(e) => setReservaId(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={loadCuenta} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <span className="badge badge-info">Auto-refresh 30s</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.9rem', marginBottom: '1rem' }}>
        <div className="stat-card">
          <span className="stat-label">Subtotal</span>
          <span className="stat-value" style={{ fontSize: '1.5rem' }}>{money(totals.subtotal)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Impuestos</span>
          <span className="stat-value" style={{ fontSize: '1.5rem' }}>{money(totals.impuestos)}</span>
        </div>
        <div className="stat-card card-gold">
          <span className="stat-label">Total acumulado</span>
          <span className="stat-value" style={{ fontSize: '1.5rem' }}>{money(totals.total)}</span>
        </div>
      </div>

      {shareLink && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Enlace de solo lectura</p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input className="form-input" value={shareLink} readOnly />
            <button
              className="btn btn-ghost"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                addToast('Enlace copiado.', 'success');
              }}
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : rows.length === 0 ? (
        <div className="empty-state"><p>No hay cargos para mostrar.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Valor unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.id_item ?? r.id ?? idx}`}>
                  <td>{String(r.fecha ?? r.created_at ?? '').slice(0, 10) || '-'}</td>
                  <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{r.concepto ?? r.descripcion ?? '-'}</td>
                  <td>{r.categoria ?? '-'}</td>
                  <td>{r.cantidad ?? 1}</td>
                  <td>{money(r.precio_unitario ?? r.valor_unitario ?? r.valor ?? 0)}</td>
                  <td>{money(r.subtotal ?? r.valor ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
