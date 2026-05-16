import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const CRITICIDAD_CLASS = { critica: 'crit-critica', alta: 'crit-alta', normal: 'crit-normal' };
const CRITICIDAD_LABEL = { critica: 'Crítica', alta: 'Alta', normal: 'Normal' };

const TAREAS = ['limpieza_rutina', 'limpieza_profunda', 'mantenimiento', 'preparacion_hab'];

export default function Inventario() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const isAdmin = auth.rol === 'Administrador';

  const [tab, setTab] = useState('alertas');

  /* ── ALERTS ─────────────────────────────────────── */
  const [alerts, setAlerts]         = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsLoaded, setAlertsLoaded]   = useState(false);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await api.inventario.alertas(auth.token);
      setAlerts(data.alertas ?? data ?? []);
      setAlertsLoaded(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setAlertsLoading(false);
    }
  }, [auth.token, addToast]);

  /* ── CONSUMO ─────────────────────────────────────── */
  const [consumoForm, setConsumoForm] = useState({ insumoId: '', cantidad: '', habitacionId: '', tipoTarea: 'limpieza_rutina', observaciones: '' });
  const [consumoLoading, setConsumoLoading] = useState(false);
  const [consumoResult, setConsumoResult]   = useState(null);

  const setC = (f) => (e) => setConsumoForm((p) => ({ ...p, [f]: e.target.value }));

  const handleConsumo = async (e) => {
    e.preventDefault();
    setConsumoLoading(true);
    setConsumoResult(null);
    try {
      const payload = {
        insumoId:    Number(consumoForm.insumoId),
        cantidad:    Number(consumoForm.cantidad),
        habitacionId: Number(consumoForm.habitacionId),
        tipoTarea:   consumoForm.tipoTarea,
        observaciones: consumoForm.observaciones || undefined,
      };
      const data = await api.inventario.consumo(payload, auth.token);
      setConsumoResult({ type: 'success', data });
      addToast('Consumo de insumo registrado.', 'success');
      setConsumoForm({ insumoId: '', cantidad: '', habitacionId: '', tipoTarea: 'limpieza_rutina', observaciones: '' });
    } catch (err) {
      setConsumoResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setConsumoLoading(false);
    }
  };

  /* ── UMBRAL ──────────────────────────────────────── */
  const [umbralForm, setUmbralForm]   = useState({ id: '', umbral: '' });
  const [umbralLoading, setUmbralLoading] = useState(false);
  const [umbralResult, setUmbralResult]   = useState(null);

  const setU = (f) => (e) => setUmbralForm((p) => ({ ...p, [f]: e.target.value }));

  const handleUmbral = async (e) => {
    e.preventDefault();
    setUmbralLoading(true);
    setUmbralResult(null);
    try {
      const data = await api.inventario.umbral(umbralForm.id, Number(umbralForm.umbral), auth.token);
      setUmbralResult({ type: 'success', data });
      addToast('Umbral de stock actualizado.', 'success');
      setUmbralForm({ id: '', umbral: '' });
    } catch (err) {
      setUmbralResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setUmbralLoading(false);
    }
  };

  const TABS = [
    ...(isAdmin ? [{ id: 'alertas', label: 'Alertas de Stock' }] : []),
    { id: 'consumo', label: 'Registrar Consumo' },
    ...(isAdmin ? [{ id: 'umbral', label: 'Actualizar Umbral' }] : []),
  ];

  return (
    <>
      <div className="page-header">
        <h1>Inventario</h1>
        <p>Controle el stock de insumos y reciba alertas cuando el nivel sea crítico</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--c-border)', paddingBottom: '0' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === 'alertas' && !alertsLoaded) loadAlerts(); }}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: tab === t.id ? 'var(--c-gold)' : 'var(--c-text-2)',
              borderBottom: tab === t.id ? '2px solid var(--c-gold)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.2s ease',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ALERTS TAB ────────────────────────────── */}
      {tab === 'alertas' && isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={loadAlerts} disabled={alertsLoading}>
              {alertsLoading ? 'Cargando…' : '↻ Actualizar'}
            </button>
          </div>

          {alertsLoading && <div className="spinner-wrap"><div className="spinner" /></div>}

          {!alertsLoading && alertsLoaded && alerts.length === 0 && (
            <div className="empty-state">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>Todos los insumos tienen stock suficiente.</p>
            </div>
          )}

          {!alertsLoading && alerts.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Stock actual</th>
                    <th>Umbral mínimo</th>
                    <th>Criticidad</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id_insumo ?? a.insumoId ?? a.nombre}>
                      <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{a.nombre}</td>
                      <td>{a.stock_actual ?? a.stockActual}</td>
                      <td>{a.stock_minimo ?? a.umbral}</td>
                      <td>
                        <span className={`badge ${CRITICIDAD_CLASS[a.criticidad] ?? 'badge-info'}`}>
                          {CRITICIDAD_LABEL[a.criticidad] ?? a.criticidad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── CONSUMO TAB ───────────────────────────── */}
      {tab === 'consumo' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Registrar Consumo de Insumo</p>
            <span className="gold-line" />
            <form onSubmit={handleConsumo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">ID Insumo</label>
                  <input type="number" className="form-input" placeholder="ID del insumo" min="1" value={consumoForm.insumoId} onChange={setC('insumoId')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input type="number" className="form-input" placeholder="Unidades consumidas" min="1" value={consumoForm.cantidad} onChange={setC('cantidad')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ID Habitación</label>
                <input type="number" className="form-input" placeholder="ID de la habitación" min="1" value={consumoForm.habitacionId} onChange={setC('habitacionId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de tarea</label>
                <select className="form-select" value={consumoForm.tipoTarea} onChange={setC('tipoTarea')}>
                  {TAREAS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones (opcional)</label>
                <textarea className="form-textarea" placeholder="Notas adicionales…" value={consumoForm.observaciones} onChange={setC('observaciones')} />
              </div>

              {consumoResult?.type === 'success' && <div className="alert alert-success">✓ Consumo registrado correctamente.</div>}
              {consumoResult?.type === 'error'   && <div className="alert alert-error">{consumoResult.msg}</div>}

              <button type="submit" className="btn btn-gold btn-full" disabled={consumoLoading}>
                {consumoLoading ? 'Registrando…' : 'Registrar Consumo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── UMBRAL TAB ────────────────────────────── */}
      {tab === 'umbral' && isAdmin && (
        <div style={{ maxWidth: 400 }}>
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Actualizar Umbral de Stock</p>
            <span className="gold-line" />
            <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', margin: '0.75rem 0 1.25rem' }}>
              El umbral es el nivel mínimo de stock que activa las alertas de reposición.
            </p>
            <form onSubmit={handleUmbral} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">ID Insumo</label>
                <input type="number" className="form-input" placeholder="ID del insumo" min="1" value={umbralForm.id} onChange={setU('id')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nuevo Umbral</label>
                <input type="number" className="form-input" placeholder="Unidades mínimas" min="1" value={umbralForm.umbral} onChange={setU('umbral')} required />
              </div>

              {umbralResult?.type === 'success' && <div className="alert alert-success">✓ Umbral actualizado.</div>}
              {umbralResult?.type === 'error'   && <div className="alert alert-error">{umbralResult.msg}</div>}

              <button type="submit" className="btn btn-gold btn-full" disabled={umbralLoading}>
                {umbralLoading ? 'Actualizando…' : 'Actualizar Umbral'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
