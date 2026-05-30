import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const CRITICIDAD_CLASS = { critica: 'crit-critica', alta: 'crit-alta', normal: 'crit-normal' };
const CRITICIDAD_LABEL = { critica: 'Crítica', alta: 'Alta', normal: 'Normal' };

const TAREAS = [
  { value: 'limpieza_rutina',   label: 'Limpieza rutina'   },
  { value: 'limpieza_profunda', label: 'Limpieza profunda' },
  { value: 'mantenimiento',     label: 'Mantenimiento'     },
  { value: 'preparacion_hab',   label: 'Preparación hab.'  },
];

const CATEGORIAS_INSUMO = [
  { value: 'quimico',      label: 'Químico'      },
  { value: 'textil',       label: 'Textil'       },
  { value: 'papel',        label: 'Papel'        },
  { value: 'herramienta',  label: 'Herramienta'  },
  { value: 'electronico',  label: 'Electrónico'  },
  { value: 'otro',         label: 'Otro'         },
];

const UNIDADES_MEDIDA = [
  { value: 'unidad',  label: 'Unidad'  },
  { value: 'litro',   label: 'Litro'   },
  { value: 'kg',      label: 'Kg'      },
  { value: 'gramo',   label: 'Gramo'   },
  { value: 'metro',   label: 'Metro'   },
  { value: 'rollo',   label: 'Rollo'   },
  { value: 'paquete', label: 'Paquete' },
];

export default function Inventario() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const isAdmin = auth.rol === 'Administrador';

  const [tab, setTab] = useState(isAdmin ? 'insumos' : 'consumo');

  // Insumos (catálogo dinámico)
  const [insumos, setInsumos]         = useState([]);
  const [insumosLoading, setInsumosLoading] = useState(false);

  const loadInsumos = useCallback(async () => {
    setInsumosLoading(true);
    try {
      const res = await api.inventario.listarInsumos(auth.token);
      setInsumos(res.data ?? res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setInsumosLoading(false);
    }
  }, [auth.token, addToast]);

  // Stock crítico
  const [stockCritico, setStockCritico]       = useState([]);
  const [stockLoading, setStockLoading]         = useState(false);
  const [stockLoaded, setStockLoaded]           = useState(false);

  const loadStockCritico = useCallback(async () => {
    setStockLoading(true);
    try {
      await loadInsumos();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setStockLoading(false);
    }
  }, [loadInsumos, addToast]);

  useEffect(() => {
    const criticalItems = insumos
      .filter((ins) => {
        const stock = ins.stock_actual ?? ins.stockActual ?? 0;
        const umbral = ins.stock_minimo ?? ins.umbral ?? 0;
        return stock <= umbral;
      })
      .map((ins) => {
        const stock = ins.stock_actual ?? ins.stockActual ?? 0;
        const umbral = ins.stock_minimo ?? ins.umbral ?? 0;
        
        let criticidad = 'normal';
        if (stock <= umbral / 2) {
          criticidad = 'critica';
        } else if (stock <= umbral) {
          criticidad = 'alta';
        }
        
        return {
          id_insumo: ins.id_insumo ?? ins.id,
          nombre: ins.nombre,
          stock_actual: stock,
          stock_minimo: umbral,
          criticidad,
        };
      })
      .sort((a, b) => {
        const priority = { critica: 1, alta: 2, normal: 3 };
        return (priority[a.criticidad] ?? 3) - (priority[b.criticidad] ?? 3);
      });

    setStockCritico(criticalItems);
    setStockLoaded(true);
  }, [insumos]);

  // Alertas
  const [alerts, setAlerts]           = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsLoaded, setAlertsLoaded]   = useState(false);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await api.inventario.alertas(auth.token);
      setAlerts(data.data ?? data.alertas ?? []);
      setAlertsLoaded(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setAlertsLoading(false);
    }
  }, [auth.token, addToast]);

  // Historial
  const [historial, setHistorial]       = useState([]);
  const [histLoading, setHistLoading]   = useState(false);
  const [histLoaded, setHistLoaded]     = useState(false);

  const loadHistorial = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await api.inventario.historial({}, auth.token);
      setHistorial(res.data ?? res);
      setHistLoaded(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setHistLoading(false);
    }
  }, [auth.token, addToast]);

  useEffect(() => {
    loadInsumos();
  }, [loadInsumos]);

  const handleTabChange = (id) => {
    setTab(id);
    if (id === 'stockCritico' && !stockLoaded) loadStockCritico();
    if (id === 'alertas' && !alertsLoaded) loadAlerts();
    if (id === 'historial' && !histLoaded) loadHistorial();
  };

  /* â”€â”€ CONSUMO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [consumoForm, setConsumoForm] = useState({ insumoId: '', cantidad: '', habitacionId: '', tipoTarea: 'limpieza_rutina', observaciones: '' });
  const [consumoLoading, setConsumoLoading] = useState(false);
  const [consumoResult, setConsumoResult]   = useState(null);

  const setC = (f) => (e) => setConsumoForm((p) => ({ ...p, [f]: e.target.value }));

  const handleConsumo = async (e) => {
    e.preventDefault();
    if (!consumoForm.habitacionId) {
      addToast('El ID de habitación es obligatorio para registrar consumo de inventario.', 'warning');
      return;
    }
    if (!auth.id_personal && auth.rol !== 'PersonalLimpieza') {
      addToast('Solo personal de limpieza puede registrar consumos de inventario.', 'warning');
      return;
    }

    setConsumoLoading(true);
    setConsumoResult(null);
    try {
      const habitacionesRes = await api.habitaciones.listar(auth.token);
      const habitaciones = habitacionesRes?.data ?? habitacionesRes ?? [];
      const habitacionIngresada = String(consumoForm.habitacionId).trim();
      const habitacion = habitaciones.find((h) => (
        String(h.id_habitacion) === habitacionIngresada
        || String(h.numero_habitacion ?? h.numero) === habitacionIngresada
      ));

      if (!habitacion?.id_habitacion) {
        throw new Error('La habitación ingresada no existe. Usa el ID o número real de la habitación.');
      }

      const payload = {
        insumoId:    Number(consumoForm.insumoId),
        cantidad:    Number(consumoForm.cantidad),
        habitacionId: Number(habitacion.id_habitacion),
        tipoTarea:   consumoForm.tipoTarea,
        observaciones: consumoForm.observaciones || undefined,
        idPersonal: auth.id_personal ?? undefined,
      };
      const data = await api.inventario.registrarConsumo(payload, auth.token);
      setConsumoResult({ type: 'success', data });
      addToast('Consumo de insumo registrado.', 'success');
      setConsumoForm({ insumoId: '', cantidad: '', habitacionId: '', tipoTarea: 'limpieza_rutina', observaciones: '' });
      loadInsumos();
    } catch (err) {
      setConsumoResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setConsumoLoading(false);
    }
  };

  /* ── UMBRAL ──────────────────────────────────────────────────────── */
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
      loadInsumos();
    } catch (err) {
      setUmbralResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setUmbralLoading(false);
    }
  };

  const insumosSeleccionado = insumos.find((i) => String(i.id_insumo ?? i.id) === String(umbralForm.id));

  /* ── NUEVO INSUMO ────────────────────────────────────────────────── */
  const NUEVO_INSUMO_INICIAL = { nombre: '', categoria: 'quimico', unidad_medida: 'unidad', stock_actual: '', stock_minimo: '' };
  const [nuevoInsumoForm, setNuevoInsumoForm] = useState(NUEVO_INSUMO_INICIAL);
  const [nuevoInsumoLoading, setNuevoInsumoLoading] = useState(false);
  const [nuevoInsumoResult, setNuevoInsumoResult]   = useState(null);

  const setNI = (f) => (e) => setNuevoInsumoForm((p) => ({ ...p, [f]: e.target.value }));

  const handleNuevoInsumo = async (e) => {
    e.preventDefault();
    setNuevoInsumoLoading(true);
    setNuevoInsumoResult(null);
    try {
      const payload = {
        nombre:        nuevoInsumoForm.nombre.trim(),
        categoria:     nuevoInsumoForm.categoria,
        unidad_medida: nuevoInsumoForm.unidad_medida,
        stock_actual:  Number(nuevoInsumoForm.stock_actual),
        stock_minimo:  Number(nuevoInsumoForm.stock_minimo),
      };
      const data = await api.inventario.crearInsumo(payload, auth.token);
      setNuevoInsumoResult({ type: 'success', data });
      addToast(`Insumo "${payload.nombre}" creado correctamente.`, 'success');
      setNuevoInsumoForm(NUEVO_INSUMO_INICIAL);
      loadInsumos();
    } catch (err) {
      setNuevoInsumoResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setNuevoInsumoLoading(false);
    }
  };

  /* ── AÑADIR STOCK ────────────────────────────────────────────────── */
  const [stockForm, setStockForm] = useState({ id: '', cantidad: '' });
  const [stockAddLoading, setStockAddLoading] = useState(false);
  const [stockAddResult, setStockAddResult]   = useState(null);

  const setSK = (f) => (e) => setStockForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAgregarStock = async (e) => {
    e.preventDefault();
    setStockAddLoading(true);
    setStockAddResult(null);
    try {
      const data = await api.inventario.agregarStock(stockForm.id, Number(stockForm.cantidad), auth.token);
      setStockAddResult({ type: 'success', data });
      addToast('Stock actualizado correctamente.', 'success');
      setStockForm({ id: '', cantidad: '' });
      loadInsumos();
    } catch (err) {
      setStockAddResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setStockAddLoading(false);
    }
  };

  const insumoStockSeleccionado = insumos.find((i) => String(i.id_insumo ?? i.id) === String(stockForm.id));

  const TABS = [
    ...(isAdmin ? [
      { id: 'insumos',      label: 'Insumos'        },
      { id: 'stockCritico', label: 'Stock Crítico'   },
      { id: 'historial',    label: 'Historial'       },
      { id: 'alertas',      label: 'Alertas'         },
    ] : []),
    ...(!isAdmin ? [
      { id: 'consumo',      label: 'Registrar Consumo' },
    ] : []),
    ...(isAdmin ? [
      { id: 'umbral',       label: 'Actualizar Umbral' },
      { id: 'nuevoInsumo',  label: '+ Nuevo Insumo'    },
      { id: 'añadirStock',  label: '+ Añadir Stock'    },
    ] : []),
  ];

  const fmt = (n) => Number(n || 0).toLocaleString('es-CO');

  return (
    <>
      <div className="page-header">
        <h1>Inventario</h1>
        <p>Controle el stock de insumos y reciba alertas cuando el nivel sea crítico</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--c-border)', paddingBottom: '0', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: tab === t.id ? 'var(--c-gold)' : 'var(--c-text-2)',
              marginBottom: '-1px',
              transition: 'all 0.2s ease',
              background: 'none',
              cursor: 'pointer',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: tab === t.id ? 'var(--c-gold)' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INSUMOS TAB ────────────────────────────────────────── */}
      {tab === 'insumos' && isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={loadInsumos} disabled={insumosLoading}>
              {insumosLoading ? 'Cargando…' : 'Actualizar'}
            </button>
          </div>
          {insumosLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!insumosLoading && insumos.length === 0 && (
            <div className="empty-state"><p>No hay insumos registrados.</p></div>
          )}
          {!insumosLoading && insumos.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Unidad</th>
                    <th>Stock actual</th>
                    <th>Umbral mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((ins) => {
                    const id = ins.id_insumo ?? ins.id;
                    const stock = ins.stock_actual ?? ins.stockActual ?? 0;
                    const umbral = ins.stock_minimo ?? ins.umbral ?? 0;
                    const critico = stock <= umbral;
                    return (
                      <tr key={id}>
                        <td>{id}</td>
                        <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{ins.nombre}</td>
                        <td>{ins.categoria}</td>
                        <td>{ins.unidad_medida}</td>
                        <td>{fmt(stock)}</td>
                        <td>{fmt(umbral)}</td>
                        <td>
                          {critico
                            ? <span className="badge crit-critica">Crítico</span>
                            : <span className="badge badge-success">✓ OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── STOCK CRÍTICO TAB ────────────────────────────────────────── */}
      {tab === 'stockCritico' && isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={loadStockCritico} disabled={stockLoading}>
              {stockLoading ? 'Cargando…' : 'Actualizar'}
            </button>
          </div>
          {stockLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!stockLoading && stockLoaded && stockCritico.length === 0 && (
            <div className="empty-state">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>Todos los insumos tienen stock suficiente.</p>
            </div>
          )}
          {!stockLoading && stockCritico.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Insumo</th><th>Stock actual</th><th>Umbral mínimo</th><th>Criticidad</th></tr>
                </thead>
                <tbody>
                  {stockCritico.map((a) => (
                    <tr key={a.id_insumo ?? a.nombre}>
                      <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{a.nombre}</td>
                      <td>{fmt(a.stock_actual ?? a.stockActual)}</td>
                      <td>{fmt(a.stock_minimo ?? a.umbral)}</td>
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

      {/* ── HISTORIAL TAB ────────────────────────────────────────── */}
      {tab === 'historial' && isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={loadHistorial} disabled={histLoading}>
              {histLoading ? 'Cargando…' : '» Actualizar'}
            </button>
          </div>
          {histLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!histLoading && histLoaded && historial.length === 0 && (
            <div className="empty-state"><p>No hay registros en el historial.</p></div>
          )}
          {!histLoading && historial.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Insumo</th>
                    <th>Cantidad</th>
                    <th>Tarea</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {(h.fecha_consumo ?? h.fecha)
                          ? new Date(h.fecha_consumo ?? h.fecha).toLocaleString('es-CO')
                          : '—'}
                      </td>
                      <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>
                        {h.insumo_nombre ?? h.nombre_insumo ?? h.nombre ?? '—'}
                      </td>
                      <td>{h.cantidad}</td>
                      <td>{h.tipo_tarea ?? h.tipoTarea ?? '—'}</td>
                      <td>{h.personal_nombre ?? h.usuario ?? h.nombre_usuario ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── ALERTS TAB ────────────────────────────────────────── */}
      {tab === 'alertas' && isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={loadAlerts} disabled={alertsLoading}>
              {alertsLoading ? 'Cargando…' : '» Actualizar'}
            </button>
          </div>
          {alertsLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!alertsLoading && alertsLoaded && alerts.length === 0 && (
            <div className="empty-state">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>No hay alertas activas de stock.</p>
            </div>
          )}
          {!alertsLoading && alerts.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Insumo</th><th>Stock actual</th><th>Umbral mínimo</th><th>Criticidad</th></tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id_insumo ?? a.nombre}>
                      <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{a.nombre}</td>
                      <td>{fmt(a.stock_actual ?? a.stockActual)}</td>
                      <td>{fmt(a.stock_minimo ?? a.umbral)}</td>
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

      {/* ── CONSUMO TAB ────────────────────────────────────────── */}
      {tab === 'consumo' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Registrar Consumo de Insumo</p>
            <span className="gold-line" />
            <form onSubmit={handleConsumo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Insumo</label>
                <select className="form-select" value={consumoForm.insumoId} onChange={setC('insumoId')} required>
                  <option value="">— Seleccione un insumo —</option>
                  {insumos.map((ins) => {
                    const id = ins.id_insumo ?? ins.id;
                    return (
                      <option key={id} value={id}>
                        {ins.nombre} · {ins.categoria} ({ins.unidad_medida}) · Stock: {fmt(ins.stock_actual ?? ins.stockActual ?? 0)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID o número de Habitación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 3 o 201"
                  value={consumoForm.habitacionId}
                  onChange={setC('habitacionId')}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input type="number" className="form-input" placeholder="Unidades consumidas" min="1" value={consumoForm.cantidad} onChange={setC('cantidad')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de tarea</label>
                  <select className="form-select" value={consumoForm.tipoTarea} onChange={setC('tipoTarea')}>
                    {TAREAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
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

      {/* ── UMBRAL TAB ─────────────────────────────────────────────────── */}
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
                <label className="form-label">Insumo</label>
                <select className="form-select" value={umbralForm.id} onChange={setU('id')} required>
                  <option value="">— Seleccione un insumo —</option>
                  {insumos.map((ins) => {
                    const id = ins.id_insumo ?? ins.id;
                    return (
                      <option key={id} value={id}>{ins.nombre} · {ins.categoria}</option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nuevo umbral mínimo ({insumosSeleccionado?.unidad_medida ?? 'unidades'})
                </label>
                <input type="number" className="form-input" placeholder="Cantidad mínima de stock" min="1" value={umbralForm.umbral} onChange={setU('umbral')} required />
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

      {/* ── NUEVO INSUMO TAB ───────────────────────────────────────────────── */}
      {tab === 'nuevoInsumo' && isAdmin && (
        <div style={{ maxWidth: 520 }}>
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Registrar Nuevo Insumo</p>
            <span className="gold-line" />
            <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', margin: '0.75rem 0 0.25rem' }}>
              Agrega un insumo nuevo al catálogo de inventario.
              Requiere el endpoint{' '}
              <code style={{ padding: '0.1rem 0.4rem', background: 'var(--c-surface-2)', borderRadius: 4, fontSize: '0.78rem' }}>
                POST /inventario/insumos
              </code>{' '}
              en el backend.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 1.25rem', padding: '0.6rem 0.9rem', background: 'rgba(255,200,0,0.07)', border: '1px solid rgba(255,200,0,0.25)', borderRadius: 8 }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>
                Endpoint pendiente de implementación. El formulario está listo para cuando esté disponible.
              </span>
            </div>
            <form onSubmit={handleNuevoInsumo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre del insumo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Desinfectante multiusos"
                  value={nuevoInsumoForm.nombre}
                  onChange={setNI('nombre')}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-select" value={nuevoInsumoForm.categoria} onChange={setNI('categoria')} required>
                    {CATEGORIAS_INSUMO.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unidad de medida *</label>
                  <select className="form-select" value={nuevoInsumoForm.unidad_medida} onChange={setNI('unidad_medida')} required>
                    {UNIDADES_MEDIDA.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Stock inicial *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Cantidad en bodega"
                    min="0"
                    value={nuevoInsumoForm.stock_actual}
                    onChange={setNI('stock_actual')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Umbral mínimo *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Mínimo antes de alerta"
                    min="1"
                    value={nuevoInsumoForm.stock_minimo}
                    onChange={setNI('stock_minimo')}
                    required
                  />
                </div>
              </div>

              {nuevoInsumoResult?.type === 'success' && (
                <div className="alert alert-success">✓ Insumo creado correctamente. Ya aparece en la lista de insumos.</div>
              )}
              {nuevoInsumoResult?.type === 'error' && (
                <div className="alert alert-error">{nuevoInsumoResult.msg}</div>
              )}

              <button type="submit" className="btn btn-gold btn-full" disabled={nuevoInsumoLoading}>
                {nuevoInsumoLoading ? 'Creando insumo…' : 'Crear Insumo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── AÑADIR STOCK TAB ───────────────────────────────────────────────── */}
      {tab === 'añadirStock' && isAdmin && (
        <div style={{ maxWidth: 420 }}>
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Añadir Stock a Insumo</p>
            <span className="gold-line" />
            <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', margin: '0.75rem 0 0.25rem' }}>
              Aumenta el stock de un insumo existente (reposición de bodega). Requiere el endpoint{' '}
              <code style={{ padding: '0.1rem 0.4rem', background: 'var(--c-surface-2)', borderRadius: 4, fontSize: '0.78rem' }}>
                PATCH /inventario/:id/stock
              </code>{' '}
              en el backend.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 1.25rem', padding: '0.6rem 0.9rem', background: 'rgba(255,200,0,0.07)', border: '1px solid rgba(255,200,0,0.25)', borderRadius: 8 }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>
                Endpoint pendiente de implementación. El formulario está listo para cuando esté disponible.
              </span>
            </div>
            <form onSubmit={handleAgregarStock} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Insumo *</label>
                <select className="form-select" value={stockForm.id} onChange={setSK('id')} required>
                  <option value="">— Seleccione un insumo —</option>
                  {insumos.map((ins) => {
                    const id = ins.id_insumo ?? ins.id;
                    const stock = ins.stock_actual ?? 0;
                    const umbral = ins.stock_minimo ?? 0;
                    return (
                      <option key={id} value={id}>
                        {ins.nombre} · Stock: {fmt(stock)} {ins.unidad_medida}{stock <= umbral ? ' ⚠️' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {insumoStockSeleccionado && (
                <div style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', padding: '0.6rem 0.9rem', background: 'var(--c-surface-2)', borderRadius: 8, display: 'flex', gap: '1.5rem' }}>
                  <span>Stock actual: <strong style={{ color: 'var(--c-text)' }}>{fmt(insumoStockSeleccionado.stock_actual ?? 0)} {insumoStockSeleccionado.unidad_medida}</strong></span>
                  <span>Umbral mínimo: <strong style={{ color: 'var(--c-text)' }}>{fmt(insumoStockSeleccionado.stock_minimo ?? 0)}</strong></span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Cantidad a añadir{insumoStockSeleccionado ? ` (${insumoStockSeleccionado.unidad_medida})` : ''} *
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Unidades a ingresar a bodega"
                  min="1"
                  value={stockForm.cantidad}
                  onChange={setSK('cantidad')}
                  required
                />
              </div>

              {stockAddResult?.type === 'success' && (
                <div className="alert alert-success">✓ Stock añadido correctamente.</div>
              )}
              {stockAddResult?.type === 'error' && (
                <div className="alert alert-error">{stockAddResult.msg}</div>
              )}

              <button type="submit" className="btn btn-gold btn-full" disabled={stockAddLoading}>
                {stockAddLoading ? 'Añadiendo stock…' : 'Añadir Stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
