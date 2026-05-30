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

export default function Auditoria() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [filtros, setFiltros] = useState({ accion: '', tabla: '', usuario_id: '', limite: '50', pagina: '1' });
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
                    <td style={{ maxWidth: 280, fontSize: '0.75rem', color: 'var(--c-text-2)' }}>
                      {r.detalle ?? r.descripcion ?? r.descripcion_cambio ?? ''}
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
    </>
  );
}
