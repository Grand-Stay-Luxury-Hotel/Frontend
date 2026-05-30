import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { calcularPenalizacion } from '../utils/penalizacion.js';
import GoldDatePicker from '../components/GoldDatePicker.jsx';

const ESTADOS_ACTIVOS = ['pendiente', 'confirmada', 'en_curso'];
const ESTADO_BADGE = {
  pendiente: 'badge-warning',
  confirmada: 'badge-info',
  en_curso: 'badge-success',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">âœ•</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Reservas() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = location.state ?? {};

  const today = new Date().toISOString().split('T')[0];

  // Habitaciones disponibles del backend
  const [habitaciones, setHabitaciones] = useState([]);
  // Búsqueda de huésped por documento (Recepcionista/Admin)
  const [docBusqueda, setDocBusqueda] = useState('');
  const [huespedEncontrado, setHuespedEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const [form, setForm] = useState({
    id_huesped:     auth.id_huesped ?? '',
    id_habitacion:  prefill.room?.id_habitacion ?? '',
    fecha_entrada:  prefill.fechaEntrada ?? today,
    fecha_salida:   prefill.fechaSalida  ?? '',
    monto_anticipo: '',
    token_pago:     '',
    observaciones:  '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  // Cancel
  const [cancelId, setCancelId]         = useState('');
  const [cancelFecha, setCancelFecha]   = useState('');
  const [cancelMonto, setCancelMonto]   = useState('');
  const [cancelInfo, setCancelInfo]     = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [penaltyPreview, setPenaltyPreview] = useState(null);
  const [reservasActivas, setReservasActivas] = useState([]);
  const [loadingActivas, setLoadingActivas] = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  // Cargar habitaciones disponibles
  useEffect(() => {
    if (auth.rol === 'Recepcionista' || auth.rol === 'Administrador') {
      api.habitaciones.listar(auth.token)
        .then((res) => {
          const lista = res.data ?? res;
          setHabitaciones(lista.filter((h) => h.estado === 'disponible'));
        })
        .catch(() => {});
    } else if (auth.rol === 'Huesped' && !prefill.room) {
      const entrada = form.fecha_entrada || today;
      // Fallback: entrada + 1 día (no Date.now() + 1 que puede ser < entrada)
      const salidaFallback = new Date(new Date(`${entrada}T00:00:00Z`).getTime() + 86400000).toISOString().split('T')[0];
      const salida  = form.fecha_salida || salidaFallback;
      if (salida <= entrada) return; // fechas inválidas, esperar
      api.disponibilidad.consultar({ fechaEntrada: entrada, fechaSalida: salida }, auth.token)
        .then((res) => {
          const lista = res.habitaciones ?? res ?? [];
          // Normaliza campo numero_habitacion → numero para compatibilidad con el select
          setHabitaciones(lista.map((h) => ({ ...h, numero: h.numero ?? h.numero_habitacion })));
        })
        .catch(() => {});
    }
  }, [auth.token, auth.rol, form.fecha_entrada, form.fecha_salida]); // eslint-disable-line react-hooks/exhaustive-deps

  /* â”€â”€ Buscar huésped por documento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const buscarHuesped = async () => {
    if (!docBusqueda.trim()) { addToast('Ingrese un número de documento.', 'warning'); return; }
    setBuscando(true);
    try {
      const res = await api.reservas.buscarPorDocumento(docBusqueda.trim(), auth.token);
      const h = res.data ?? res;
      setHuespedEncontrado(h);
      setForm((f) => ({ ...f, id_huesped: h.id_huesped }));
      addToast(`Huésped encontrado: ${h.nombre_completo}`, 'success');
    } catch (e) {
      setHuespedEncontrado(null);
      addToast(e.message || 'Huésped no encontrado.', 'error');
    } finally {
      setBuscando(false);
    }
  };

  /* â”€â”€ CREATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        id_huesped:     Number(form.id_huesped),
        id_habitacion:  Number(form.id_habitacion),
        fecha_entrada:  form.fecha_entrada,
        fecha_salida:   form.fecha_salida,
        monto_anticipo: Number(form.monto_anticipo),
        token_pago:     form.token_pago.trim() || `tok_test_${Math.random().toString(36).substring(2, 9)}`,
        observaciones:  form.observaciones || undefined,
      };
      const data = await api.reservas.crear(payload, auth.token);
      setResult({ type: 'success', data });
      addToast(`Reserva confirmada — N° ${data.id_reserva}`, 'success');
      setForm((f) => ({ ...f, id_huesped: '', id_habitacion: prefill.room?.id_habitacion ?? '', token_pago: '', monto_anticipo: '', observaciones: '' }));
      setHuespedEncontrado(null);
      setDocBusqueda('');
      await cargarReservasActivas();
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* â”€â”€ CANCEL PREVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleCancelPreview = () => {
    if (!cancelId) { addToast('Ingrese el ID de reserva.', 'warning'); return; }
    let preview = null;
    if (cancelFecha && cancelMonto) {
      preview = calcularPenalizacion(cancelFecha, Number(cancelMonto));
    }
    setPenaltyPreview(preview);
    setConfirmModal(true);
    setCancelInfo(null);
  };

  const handleCancelConfirm = async () => {
    setCancelLoading(true);
    try {
      const data = await api.reservas.cancelar(cancelId, auth.token);
      setCancelInfo({ type: 'success', data });
      addToast('Reserva cancelada exitosamente.', 'success');
      setConfirmModal(false);
      setCancelId('');
      await cargarReservasActivas();
    } catch (err) {
      addToast(err.message, 'error');
      setConfirmModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const isRecep = ['Recepcionista'].includes(auth.rol);
  const isHuesped = ['Huesped', 'Huésped'].includes(auth.rol);
  const canCreate = isRecep || isHuesped;
  const canCancel = isRecep;
  const esRecepAdmin = isRecep;

  const cargarReservasActivas = useCallback(async () => {
    if (!esRecepAdmin) return;
    setLoadingActivas(true);
    try {
      const res = await api.reservas.listar(auth.token);
      const lista = res.data ?? res ?? [];
      setReservasActivas(
        lista.filter((r) => ESTADOS_ACTIVOS.includes(String(r.estado ?? '').toLowerCase())),
      );
    } catch (error) {
      addToast(error.message || 'No se pudieron cargar las reservas activas.', 'error');
      setReservasActivas([]);
    } finally {
      setLoadingActivas(false);
    }
  }, [addToast, auth.token, esRecepAdmin]);

  useEffect(() => {
    cargarReservasActivas();
  }, [cargarReservasActivas]);

  return (
    <>
      <div className="page-header">
        <h1>Gestión de Reservas</h1>
        <p>Cree una nueva reserva o gestione cancelaciones según la política de penalización vigente</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canCancel ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

        {/* â”€â”€ CREATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {canCreate && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Nueva Reserva</p>
            <span className="gold-line" />
            {prefill.room && (
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                Habitación preseleccionada: <strong>N&#186; {prefill.room.numero_habitacion} — {prefill.room.tipo_nombre}</strong>
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Huésped */}
              <div className="form-group">
                <label className="form-label">Huésped</label>
                {auth.rol === 'Huesped' ? (
                  <input type="text" className="form-input" value={`Cuenta propia · ${auth.email ?? ''}`} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar por N° documento..."
                        value={docBusqueda}
                        onChange={(e) => setDocBusqueda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarHuesped())}
                        style={{ flex: 1 }}
                      />
                      <button type="button" className="btn btn-outline btn-sm" onClick={buscarHuesped} disabled={buscando}>
                        {buscando ? '…' : 'Buscar'}
                      </button>
                    </div>
                    {huespedEncontrado ? (
                      <div style={{ background: 'var(--c-gold-bg)', border: '1px solid var(--c-gold-border)', borderRadius: 'var(--r-sm)', padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: 'var(--c-gold-light)' }}>
                        ✓ <strong>{huespedEncontrado.nombre_completo}</strong> · {huespedEncontrado.email}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>Busque al huésped por su número de documento para asignarlo.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Habitación */}
              <div className="form-group">
                <label className="form-label">Habitación</label>
                {prefill.room ? (
                  <input
                    type="text"
                    className="form-input"
                    value={`Hab. ${prefill.room.numero_habitacion} · ${prefill.room.tipo_nombre} · Piso ${prefill.room.piso ?? ''}`}
                    readOnly
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                ) : (
                  <select className="form-select" value={form.id_habitacion} onChange={set('id_habitacion')} required>
                    <option value="">— Seleccione la habitación —</option>
                    {habitaciones.map((h) => (
                      <option key={h.id_habitacion} value={h.id_habitacion}>
                        Hab. {h.numero} · {h.tipo_nombre} · Piso {h.piso}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha Entrada</label>
                  <GoldDatePicker
                    value={form.fecha_entrada}
                    onChange={(v) => setForm((f) => ({ ...f, fecha_entrada: v }))}
                    minDate={today}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Salida</label>
                  <GoldDatePicker
                    value={form.fecha_salida}
                    onChange={(v) => setForm((f) => ({ ...f, fecha_salida: v }))}
                    minDate={form.fecha_entrada || today}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Monto Anticipo (COP)</label>
                <input type="number" className="form-input" placeholder="Ej. 450000" min="1" step="1" value={form.monto_anticipo} onChange={set('monto_anticipo')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Token de Pago <span style={{ fontSize: '0.72rem', color: 'var(--c-text-2)' }}>(opcional)</span></label>
                <input type="text" className="form-input" placeholder="tok_test_001 (se genera automáticamente si se omite)" value={form.token_pago} onChange={set('token_pago')} />
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.35rem' }}>Si se deja vacío, se genera uno de prueba automáticamente.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones (opcional)</label>
                <textarea className="form-textarea" placeholder="Preferencias, solicitudes especiales…" value={form.observaciones} onChange={set('observaciones')} />
              </div>
              {result?.type === 'success' && (
                <div className="alert alert-success">
                  Reserva confirmada — <strong>N° {result.data.id_reserva}</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--c-success)', marginTop: '0.35rem', marginBottom: 0 }}>
                    Guarde este número para el Check-in: <strong>#{result.data.id_reserva}</strong>
                  </p>
                </div>
              )}
              {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}
              <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
                {loading ? 'Procesando…' : 'Crear Reserva'}
              </button>
            </form>
          </div>
        )}

        {/* â”€â”€ CANCEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {canCancel && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Cancelar Reserva</p>
            <span className="gold-line" />
            <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', marginBottom: '1.25rem' }}>
              Ingrese el ID y, opcionalmente, la fecha de entrada y monto del anticipo para previsualizar la penalización antes de confirmar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">N° de Reserva</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 42"
                  value={cancelId}
                  onChange={(e) => { setCancelId(e.target.value); setCancelInfo(null); setPenaltyPreview(null); }}
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha entrada <span style={{ fontSize: '0.72rem', color: 'var(--c-text-2)' }}>(para calcular)</span></label>
                  <GoldDatePicker
                    value={cancelFecha}
                    onChange={(v) => { setCancelFecha(v); setPenaltyPreview(null); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Anticipo pagado (COP) <span style={{ fontSize: '0.72rem', color: 'var(--c-text-2)' }}>(para calcular)</span></label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ej. 450000"
                    min="1"
                    value={cancelMonto}
                    onChange={(e) => { setCancelMonto(e.target.value); setPenaltyPreview(null); }}
                  />
                </div>
              </div>
            </div>
            <button
              className="btn btn-danger btn-full"
              style={{ marginTop: '1rem' }}
              onClick={handleCancelPreview}
              disabled={cancelLoading || !cancelId}
            >
              Cancelar Reserva
            </button>

            {cancelInfo?.type === 'success' && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                Reserva cancelada. {cancelInfo.data.monto_reembolso !== undefined
                  ? `Reembolso: $${cancelInfo.data.monto_reembolso?.toLocaleString('es-CO')} · Penalización ${cancelInfo.data.penalizacion_aplicada ?? ''}%`
                  : ''}
              </div>
            )}

            <div className="card-gold" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--r-sm)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-gold)', fontWeight: 500, marginBottom: '0.5rem' }}>
                Política de cancelación
              </p>
              {[
                ['Más de 7 días antes', '0% penalización',  'badge-success'],
                ['3 – 7 días antes',   '30% del anticipo', 'badge-warning'],
                ['Menos de 3 días',    '50% del anticipo', 'badge-warning'],
                ['Día del check-in',   '100% del anticipo','badge-error'],
              ].map(([period, pena, cls]) => (
                <div key={period} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--c-border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>{period}</span>
                  <span className={`badge ${cls}`}>{pena}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {esRecepAdmin && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Reservaciones Activas</p>
              <span className="gold-line" />
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={cargarReservasActivas} disabled={loadingActivas}>
              {loadingActivas ? 'Cargando…' : '↻ Actualizar'}
            </button>
          </div>

          {loadingActivas && <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)' }}>Cargando reservaciones activas...</p>}

          {!loadingActivas && reservasActivas.length === 0 && (
            <div className="empty-state">
              <p>No hay reservaciones activas en este momento.</p>
            </div>
          )}

          {!loadingActivas && reservasActivas.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Código</th>
                    <th>Huésped</th>
                    <th>Hab.</th>
                    <th>Tipo</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Estado</th>
                    <th>Anticipo</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasActivas.map((reserva) => {
                    const estado = String(reserva.estado ?? '').toLowerCase();
                    return (
                      <tr key={reserva.id_reserva}>
                        <td>#{reserva.id_reserva}</td>
                        <td>{reserva.codigo_confirmacion ?? '—'}</td>
                        <td>{reserva.huesped_nombre ?? '—'}</td>
                        <td>{reserva.numero_habitacion ?? '—'}</td>
                        <td>{reserva.tipo_habitacion ?? '—'}</td>
                        <td>{reserva.fecha_entrada ?? '—'}</td>
                        <td>{reserva.fecha_salida ?? '—'}</td>
                        <td>
                          <span className={`badge ${ESTADO_BADGE[estado] ?? 'badge-gold'}`}>
                            {estado || '—'}
                          </span>
                        </td>
                        <td>${Number(reserva.monto_pagado ?? 0).toLocaleString('es-CO')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {confirmModal && (
        <Modal title="Confirmar cancelación" onClose={() => setConfirmModal(false)}>
          <p style={{ fontSize: '0.9rem', color: 'var(--c-text-2)', marginBottom: '1rem' }}>
            ¿Está seguro que desea cancelar la reserva <strong style={{ color: 'var(--c-text)' }}>#{cancelId}</strong>?
          </p>

          {penaltyPreview ? (
            <div className="card-gold card" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Penalización calculada</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--c-text-2)' }}>Porcentaje:</span>
                <span className={`badge ${penaltyPreview.porcentaje === 0 ? 'badge-success' : penaltyPreview.porcentaje < 50 ? 'badge-warning' : 'badge-error'}`}>
                  {penaltyPreview.porcentaje}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--c-text-2)' }}>Penalización:</span>
                <strong>${penaltyPreview.montoPenalizacion?.toLocaleString('es-CO')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--c-text-2)' }}>Reembolso estimado:</span>
                <strong style={{ color: 'var(--c-gold)' }}>${penaltyPreview.montoReembolso?.toLocaleString('es-CO')}</strong>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
              No se ingresó fecha de entrada ni anticipo — la penalización la calculará el servidor.
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setConfirmModal(false)}>Volver</button>
            <button className="btn btn-danger" onClick={handleCancelConfirm} disabled={cancelLoading}>
              {cancelLoading ? 'Procesando…' : 'Confirmar cancelación'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
