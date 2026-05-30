import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const ACCIONES = [
  { value: '', label: 'Todas' },
  { value: 'INSERT', label: 'Insertar' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' },
  { value: 'READ', label: 'Lectura' },
  { value: 'ACCESS_DENIED', label: 'Acceso denegado' },
];

const ACCION_LABEL = {
  INSERT: 'Insertar',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  READ: 'Lectura',
  ACCESS_DENIED: 'Acceso denegado',
};

function formatJsonValue(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function generateAuditSummary(r) {
  const prev = formatJsonValue(r.valor_anterior);
  const next = formatJsonValue(r.valor_nuevo);
  
  if (r.accion === 'LOGIN') {
    return `Inicio de sesión exitoso · IP: ${r.ip ?? '—'}`;
  }
  if (r.accion === 'LOGOUT') {
    return `Cierre de sesión · IP: ${r.ip ?? '—'}`;
  }
  
  const changes = [];
  if (prev && next) {
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const key of keys) {
      if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
        changes.push(key);
      }
    }
    if (changes.length > 0) {
      return `Modificó: ${changes.join(', ')}`;
    }
    return 'Actualización de registro (sin cambios de valores)';
  }
  
  if (next) {
    const keys = Object.keys(next).filter(k => k !== 'hash_repositorio_externo');
    return `Creó campos: ${keys.join(', ')}`;
  }
  
  if (prev) {
    return `Eliminó registro: ${Object.keys(prev).join(', ')}`;
  }
  
  return r.ip ? `Operación desde IP: ${r.ip}` : 'Sin datos de cambio';
}

function AuditValueChanges({ valorAnterior, valorNuevo }) {
  const prev = formatJsonValue(valorAnterior);
  const next = formatJsonValue(valorNuevo);

  if (!prev && !next) {
    return <p style={{ color: 'var(--c-text-3)', fontSize: '0.82rem' }}>No hay valores registrados de cambios para esta operación.</p>;
  }

  // INSERT
  if (!prev && next) {
    const nextFields = Object.entries(next).filter(([k]) => k !== 'hash_repositorio_externo');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--c-text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valores Creados</p>
        <div style={{ background: '#111', border: '1px solid var(--c-border)', borderRadius: 8, padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>
          {nextFields.map(([key, val]) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', padding: '0.2rem 0', borderBottom: '1px solid #222' }}>
              <span style={{ color: 'var(--c-gold)' }}>{key}:</span>
              <span style={{ color: '#4ade80', wordBreak: 'break-all' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DELETE
  if (prev && !next) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--c-text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valores Eliminados</p>
        <div style={{ background: '#111', border: '1px solid var(--c-border)', borderRadius: 8, padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>
          {Object.entries(prev).map(([key, val]) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', padding: '0.2rem 0', borderBottom: '1px solid #222' }}>
              <span style={{ color: 'var(--c-gold)' }}>{key}:</span>
              <span style={{ color: '#f87171', wordBreak: 'break-all' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // UPDATE
  const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));
  const changedKeys = allKeys.filter(key => JSON.stringify(prev[key]) !== JSON.stringify(next[key]));

  if (changedKeys.length === 0) {
    return <p style={{ color: 'var(--c-text-3)', fontSize: '0.82rem' }}>La transacción se guardó, pero no hubo diferencias entre los valores anterior y nuevo.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--c-text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campos Modificados</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {changedKeys.map(key => (
          <div key={key} style={{ background: '#111', border: '1px solid var(--c-border)', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--c-gold)', fontWeight: 600, fontSize: '0.82rem' }}>{key}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              <div style={{ background: 'rgba(248, 113, 113, 0.05)', borderLeft: '3px solid #f87171', padding: '0.35rem 0.5rem', borderRadius: 4 }}>
                <span style={{ color: 'rgba(248, 113, 113, 0.6)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Anterior</span>
                <span style={{ color: '#f87171', wordBreak: 'break-all' }}>{prev[key] !== null ? (typeof prev[key] === 'object' ? JSON.stringify(prev[key]) : String(prev[key])) : 'null'}</span>
              </div>
              <div style={{ background: 'rgba(74, 222, 128, 0.05)', borderLeft: '3px solid #4ade80', padding: '0.35rem 0.5rem', borderRadius: 4 }}>
                <span style={{ color: 'rgba(74, 222, 128, 0.6)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Nuevo</span>
                <span style={{ color: '#4ade80', wordBreak: 'break-all' }}>{next[key] !== null ? (typeof next[key] === 'object' ? JSON.stringify(next[key]) : String(next[key])) : 'null'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, padding: '1rem' }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650, width: '100%', background: '#151515', border: '1px solid var(--c-border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border)' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--c-gold)' }}>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--c-text-3)', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '70vh' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Auditoria() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [filtros, setFiltros] = useState({ accion: '', tabla: '', usuario_id: '', limite: '50', pagina: '1' });
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const setF = (f) => (e) => setFiltros((p) => ({ ...p, [f]: e.target.value }));

  const buscar = useCallback(async (pag = filtros.pagina) => {
    setLoading(true);
    setBuscado(true);
    setErrorMsg('');
    try {
      const params = {};
      if (filtros.accion)     params.accion   = filtros.accion;
      if (filtros.tabla)      params.tabla    = filtros.tabla;
      if (filtros.usuario_id) params.usuario  = filtros.usuario_id;
      params.limite = filtros.limite;
      params.pagina = pag;

      const res = await api.auditoria.listar(params, auth.token);
      const payload = res.data ?? res;
      setRegistros(Array.isArray(payload) ? payload : (payload.registros ?? payload.logs ?? []));
      setTotal(payload.total ?? (Array.isArray(payload) ? payload.length : 0));
    } catch (err) {
      const msg = err.message || 'Error al consultar auditoría';
      setErrorMsg(msg);
      addToast(msg, 'error');
      setRegistros([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, auth.token, addToast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFiltros((f) => ({ ...f, pagina: '1' }));
    buscar('1');
  };

  const totalPaginas = Math.max(1, Math.ceil(total / Number(filtros.limite)));

  const irPagina = (p) => {
    const np = String(p);
    setFiltros((f) => ({ ...f, pagina: np }));
    buscar(np);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('es-CO') : '—';

  const ACCION_CLASS = {
    INSERT:        'badge-success',
    UPDATE:        'badge-warning',
    DELETE:        'badge-error',
    LOGIN:         'badge-info',
    LOGOUT:        'badge-info',
    READ:          'badge-info',
    ACCESS_DENIED: 'badge-error',
  };

  return (
    <>
      <div className="page-header">
        <h1>Auditoría del Sistema</h1>
        <p>Registro de acciones y eventos críticos realizados en el sistema</p>
      </div>

      {/* ── Filtros ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Acción</label>
              <select className="form-select" value={filtros.accion} onChange={setF('accion')}>
                {ACCIONES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tabla / Módulo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. reservas"
                value={filtros.tabla}
                onChange={setF('tabla')}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">ID de Usuario</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej. 3"
                value={filtros.usuario_id}
                onChange={setF('usuario_id')}
                min="1"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Registros por página</label>
              <select className="form-select" value={filtros.limite} onChange={setF('limite')}>
                {['25', '50', '100'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-gold" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar registros'}
          </button>
        </form>
      </div>

      {/* ── Error banner ─────────────────────────────── */}
      {errorMsg && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#f87171' }}>
          <span>⚠️ {errorMsg}</span>
          <button
            onClick={() => buscar(filtros.pagina)}
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ↻ Reintentar
          </button>
        </div>
      )}

      {/* ── Resultados ──────────────────────────────── */}
      {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

      {!loading && buscado && !errorMsg && registros.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron registros con los filtros aplicados.</p>
        </div>
      )}

      {!loading && registros.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>
              {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={() => irPagina(Number(filtros.pagina) - 1)} disabled={Number(filtros.pagina) <= 1}>
                  ←
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>
                  Pág. {filtros.pagina} / {totalPaginas}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => irPagina(Number(filtros.pagina) + 1)} disabled={Number(filtros.pagina) >= totalPaginas}>
                  →
                </button>
              </div>
            )}
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Tabla</th>
                  <th>ID Entidad</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={r.id_auditoria ?? i}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {fmtDate(r.fecha_hora ?? r.created_at ?? r.fecha ?? r.timestamp)}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--c-text)', fontWeight: 500 }}>
                        {r.nombre_usuario ?? r.usuario ?? `#${r.id_usuario ?? r.usuario_id ?? '—'}`}
                      </div>
                      {(r.id_usuario ?? r.usuario_id) && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--c-text-3)' }}>
                          ID {r.id_usuario ?? r.usuario_id}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${ACCION_CLASS[r.accion] ?? 'badge-info'}`}>
                        {ACCION_LABEL[r.accion] ?? r.accion ?? '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', fontFamily: 'monospace' }}>
                      {r.tabla_afectada ?? r.tabla ?? r.entidad ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--c-text-3)' }}>
                      {r.id_registro ?? r.id_entidad ?? r.entidad_id ?? '—'}
                    </td>
                    <td style={{ maxWidth: 300, fontSize: '0.75rem', color: 'var(--c-text-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={generateAuditSummary(r)}>
                          {generateAuditSummary(r)}
                        </span>
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelectedLog(r)}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.2rem 0.5rem',
                            color: 'var(--c-gold)',
                            borderColor: 'var(--c-gold)',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                          }}
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => irPagina(Number(filtros.pagina) - 1)} disabled={Number(filtros.pagina) <= 1}>
                ← Anterior
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>
                Pág. {filtros.pagina} / {totalPaginas}
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => irPagina(Number(filtros.pagina) + 1)} disabled={Number(filtros.pagina) >= totalPaginas}>
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {selectedLog && (
        <Modal title="Detalle de Auditoría" onClose={() => setSelectedLog(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--c-border)', paddingBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Fecha y Hora</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-text)' }}>{fmtDate(selectedLog.fecha_hora)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Usuario Responsable</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-text)', fontWeight: 500 }}>
                {selectedLog.nombre_usuario ?? selectedLog.usuario ?? `ID Usuario: #${selectedLog.id_usuario ?? selectedLog.usuario_id ?? '—'}`}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Acción Ejecutada</p>
              <span className={`badge ${ACCION_CLASS[selectedLog.accion] ?? 'badge-info'}`}>
                {ACCION_LABEL[selectedLog.accion] ?? selectedLog.accion ?? '—'}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Tabla Afectada</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', fontFamily: 'monospace' }}>
                {selectedLog.tabla_afectada ?? '—'} {selectedLog.id_registro && <span style={{ color: 'var(--c-text-3)', fontSize: '0.75rem' }}> (ID: {selectedLog.id_registro})</span>}
              </p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Dirección IP</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-text)', fontFamily: 'monospace' }}>{selectedLog.ip ?? '—'}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Dispositivo (User Agent)</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', lineHeight: '1.4', wordBreak: 'break-all' }}>{selectedLog.user_agent ?? '—'}</p>
            </div>
          </div>

          <AuditValueChanges valorAnterior={selectedLog.valor_anterior} valorNuevo={selectedLog.valor_nuevo} />
        </Modal>
      )}
    </>
  );
}
