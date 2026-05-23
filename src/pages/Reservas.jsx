import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import GoldDatePicker from '../components/GoldDatePicker.jsx';

const IMPUESTO_PCT = 0.19;

function calcularNoches(fechaEntrada, fechaSalida) {
  if (!fechaEntrada || !fechaSalida) return 0;
  const entrada = new Date(`${fechaEntrada}T00:00:00`);
  const salida = new Date(`${fechaSalida}T00:00:00`);
  const diff = salida.getTime() - entrada.getTime();
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatCOP(value) {
  return Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
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
  const prefill = location.state ?? {};

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    id_huesped:     auth.id_huesped ?? '',
    documento_huesped: '',
    id_habitacion:  prefill.room?.id_habitacion ?? '',
    fecha_entrada:  prefill.fechaEntrada ?? today,
    fecha_salida:   prefill.fechaSalida  ?? '',
    monto_anticipo: '',
    token_pago:     '',
    observaciones:  '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [tab, setTab] = useState('listar');

  const [reservas, setReservas] = useState([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [reservasLoaded, setReservasLoaded] = useState(false);
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);
  const [guestLookupResult, setGuestLookupResult] = useState(null);
  const [availableRooms, setAvailableRooms] = useState(prefill.room ? [prefill.room] : []);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Cancel
  const [cancelId, setCancelId]   = useState('');
  const [cancelInfo, setCancelInfo] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const setReservaField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBuscarHuesped = async () => {
    if (!form.documento_huesped.trim()) {
      addToast('Ingrese el documento del huésped.', 'warning');
      return;
    }
    setGuestLookupLoading(true);
    setGuestLookupResult(null);
    try {
      const data = await api.reservas.buscarHuesped(form.documento_huesped.trim(), auth.token);
      const huesped = data.huesped;
      setForm((prev) => ({ ...prev, id_huesped: String(huesped.id_huesped) }));
      setGuestLookupResult(huesped);
      addToast('Huésped encontrado.', 'success');
    } catch (err) {
      setForm((prev) => ({ ...prev, id_huesped: '' }));
      setGuestLookupResult(null);
      addToast(err.message, 'error');
    } finally {
      setGuestLookupLoading(false);
    }
  };

  const loadAvailableRooms = useCallback(async () => {
    if (!form.fecha_entrada || !form.fecha_salida) {
      setAvailableRooms([]);
      return;
    }

    setRoomsLoading(true);
    try {
      const data = await api.disponibilidad.consultar(
        {
          fechaEntrada: form.fecha_entrada,
          fechaSalida: form.fecha_salida,
        },
        auth.token,
      );
      const rooms = data.habitaciones ?? data ?? [];
      setAvailableRooms(Array.isArray(rooms) ? rooms : []);

      if (!rooms.some((room) => Number(room.id_habitacion) === Number(form.id_habitacion))) {
        setReservaField('id_habitacion', prefill.room?.id_habitacion ? String(prefill.room.id_habitacion) : '');
      }
    } catch (err) {
      setAvailableRooms([]);
      addToast(err.message, 'error');
    } finally {
      setRoomsLoading(false);
    }
  }, [addToast, auth.token, form.fecha_entrada, form.fecha_salida, form.id_habitacion, prefill.room]);

  const loadReservas = useCallback(async () => {
    setReservasLoading(true);
    try {
      const data = await api.reservas.listar(auth.token);
      setReservas(data.reservas ?? []);
      setReservasLoaded(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setReservasLoading(false);
    }
  }, [auth.token, addToast]);

  useEffect(() => {
    if (tab === 'listar' && !reservasLoaded) {
      loadReservas();
    }
  }, [tab, reservasLoaded, loadReservas]);

  useEffect(() => {
    if (tab === 'crear') {
      loadAvailableRooms();
    }
  }, [tab, form.fecha_entrada, form.fecha_salida, loadAvailableRooms]);

  /* ── CREATE ─────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        id_huesped:    Number(form.id_huesped),
        id_habitacion: Number(form.id_habitacion),
        fecha_entrada: form.fecha_entrada,
        fecha_salida:  form.fecha_salida,
        monto_anticipo: Number(form.monto_anticipo),
        token_pago:    form.token_pago,
        observaciones: form.observaciones || undefined,
      };
      const data = await api.reservas.crear(payload, auth.token);
      setResult({ type: 'success', data });
      addToast(`Reserva creada — ${data.codigo_confirmacion ?? data.codigo ?? ''}`, 'success');
      setForm((f) => ({ ...f, id_huesped: auth.id_huesped ?? '', documento_huesped: '', id_habitacion: prefill.room?.id_habitacion ?? '', token_pago: '', monto_anticipo: '', observaciones: '' }));
      setGuestLookupResult(null);
      setAvailableRooms(prefill.room ? [prefill.room] : []);
      loadReservas();
      setTab('listar');
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── CANCEL PREVIEW ─────────────────────────────── */
  const handleCancelPreview = () => {
    if (!cancelId) { addToast('Ingrese el ID de reserva.', 'warning'); return; }
    // Preview penalty locally — we need fecha_entrada + monto_pagado
    // Since we only have the ID, show confirm modal and let server compute
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
      loadReservas();
      setTab('listar');
    } catch (err) {
      addToast(err.message, 'error');
      setConfirmModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const canCreate = auth.rol === 'Recepcionista' || auth.rol === 'Huesped';
  const canCancel = auth.rol === 'Recepcionista' || auth.rol === 'Administrador';
  const selectedRoom = availableRooms.find((room) => Number(room.id_habitacion) === Number(form.id_habitacion)) ?? prefill.room ?? null;
  const noches = calcularNoches(form.fecha_entrada, form.fecha_salida);
  const tarifaNoche = Number(selectedRoom?.precio_noche ?? 0);
  const subtotalEstimado = noches * tarifaNoche;
  const impuestosEstimados = subtotalEstimado * IMPUESTO_PCT;
  const totalEstimado = subtotalEstimado + impuestosEstimados;
  const anticipoCapturado = Number(form.monto_anticipo || 0);
  const saldoEstimado = Math.max(totalEstimado - anticipoCapturado, 0);
  const tabs = [
    { id: 'listar', label: 'Ver Reservas' },
    ...(canCreate ? [{ id: 'crear', label: 'Nueva Reserva' }] : []),
    ...(canCancel ? [{ id: 'cancelar', label: 'Cancelar Reserva' }] : []),
  ];

  return (
    <>
      <div className="page-header">
        <h1>Gestión de Reservas</h1>
        <p>Consulte las reservas registradas en Grand Stay, cree nuevas y gestione cancelaciones</p>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--c-border)', paddingBottom: 0 }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: tab === item.id ? 'var(--c-gold)' : 'var(--c-text-2)',
              borderBottom: tab === item.id ? '2px solid var(--c-gold)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'listar' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div className="stat-card">
              <span className="stat-label">Total reservas</span>
              <span className="stat-value" style={{ fontSize: '1.5rem' }}>{reservas.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Confirmadas</span>
              <span className="stat-value" style={{ fontSize: '1.5rem' }}>{reservas.filter((r) => r.estado === 'confirmada').length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Canceladas</span>
              <span className="stat-value" style={{ fontSize: '1.5rem' }}>{reservas.filter((r) => r.estado === 'cancelada').length}</span>
            </div>
            <div className="stat-card card-gold">
              <span className="stat-label">Pendientes de check-in</span>
              <span className="stat-value" style={{ fontSize: '1.5rem' }}>{reservas.filter((r) => r.estado === 'confirmada').length}</span>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>Listado de Reservas</p>
                <span className="gold-line" style={{ margin: 0 }} />
              </div>
              <button className="btn btn-outline btn-sm" onClick={loadReservas} disabled={reservasLoading}>
                {reservasLoading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>

            {reservasLoading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : reservas.length === 0 ? (
              <div className="empty-state"><p>No hay reservas registradas para este usuario.</p></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Huésped</th>
                      <th>Habitación</th>
                      <th>Fechas</th>
                      <th>Estado</th>
                      <th>Canal</th>
                      <th>Anticipo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((reserva) => (
                      <tr key={reserva.id_reserva}>
                        <td>
                          <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>{reserva.codigo_confirmacion}</div>
                          <div style={{ fontSize: '0.75rem' }}>#{reserva.id_reserva}</div>
                        </td>
                        <td>
                          <div style={{ color: 'var(--c-text)', fontWeight: 500 }}>{[reserva.nombres, reserva.apellidos].filter(Boolean).join(' ') || '-'}</div>
                          <div style={{ fontSize: '0.75rem' }}>{reserva.email || '-'}</div>
                        </td>
                        <td>
                          <div style={{ color: 'var(--c-text)', fontWeight: 500 }}>{reserva.numero_habitacion || '-'}</div>
                          <div style={{ fontSize: '0.75rem' }}>{reserva.tipo_habitacion || '-'}</div>
                        </td>
                        <td>
                          <div>{String(reserva.fecha_entrada).slice(0, 10)}</div>
                          <div style={{ fontSize: '0.75rem' }}>a {String(reserva.fecha_salida).slice(0, 10)}</div>
                        </td>
                        <td>
                          <span className={`badge ${reserva.estado === 'confirmada' ? 'badge-success' : reserva.estado === 'cancelada' ? 'badge-error' : 'badge-warning'}`}>
                            {reserva.estado}
                          </span>
                        </td>
                        <td>{reserva.canal_reserva || '-'}</td>
                        <td>${Number(reserva.monto_pagado || 0).toLocaleString('es-CO')}</td>
                        <td>
                          {canCancel && reserva.estado !== 'cancelada' ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setCancelId(String(reserva.id_reserva));
                                setTab('cancelar');
                              }}
                            >
                              Cancelar
                            </button>
                          ) : (
                            <span className="badge badge-info">Sin acciones</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'crear' && canCreate && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Nueva Reserva</p>
            <span className="gold-line" />
            {prefill.room && (
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                Habitación preseleccionada: <strong>Nº {prefill.room.numero_habitacion} — {prefill.room.tipo_nombre}</strong>
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Huésped</label>
                {auth.rol === 'Huesped' ? (
                  <input type="text" className="form-input" value={`#${form.id_huesped} — cuenta propia`} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Documento del huésped"
                        value={form.documento_huesped}
                        onChange={set('documento_huesped')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBuscarHuesped();
                          }
                        }}
                        required
                      />
                      <button type="button" className="btn btn-outline" onClick={handleBuscarHuesped} disabled={guestLookupLoading}>
                        {guestLookupLoading ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                    <input type="hidden" value={form.id_huesped} />
                    {guestLookupResult && (
                      <div className="card-gold" style={{ padding: '0.85rem', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>
                          {guestLookupResult.nombres} {guestLookupResult.apellidos}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>
                          Documento: {guestLookupResult.num_documento} · Email: {guestLookupResult.email || '-'} · Tel: {guestLookupResult.telefono || '-'}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <label className="form-label">Habitación</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={loadAvailableRooms} disabled={roomsLoading}>
                    {roomsLoading ? 'Buscando...' : 'Ver disponibles'}
                  </button>
                </div>
                <select className="form-select" value={form.id_habitacion} onChange={set('id_habitacion')} required>
                  <option value="">Seleccione una habitación disponible</option>
                  {availableRooms.map((room) => (
                    <option key={room.id_habitacion} value={room.id_habitacion}>
                      Hab. {room.numero_habitacion} · {room.tipo_nombre || room.tipo_habitacion || 'Sin tipo'}
                    </option>
                  ))}
                </select>
                {!roomsLoading && availableRooms.length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--c-text-2)' }}>
                    No hay habitaciones disponibles para las fechas seleccionadas.
                  </p>
                )}
                {selectedRoom && (
                  <div className="card-gold" style={{ padding: '0.85rem', borderRadius: 'var(--r-sm)' }}>
                    <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>
                      Habitación {selectedRoom.numero_habitacion}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>
                      {selectedRoom.tipo_nombre || selectedRoom.tipo_habitacion || 'Tipo no especificado'}
                      {selectedRoom.capacidad_max ? ` · Cap. ${selectedRoom.capacidad_max}` : ''}
                      {selectedRoom.piso ? ` · Piso ${selectedRoom.piso}` : ''}
                    </div>
                    {selectedRoom.precio_noche ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--c-gold)', marginTop: '0.35rem' }}>
                        Tarifa estimada por noche: {formatCOP(selectedRoom.precio_noche)}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--c-warning)', marginTop: '0.35rem' }}>
                        No se encontró tarifa vigente para esta selección.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha Entrada</label>
                  <GoldDatePicker
                    value={form.fecha_entrada}
                    onChange={(v) => setReservaField('fecha_entrada', v)}
                    minDate={today}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Salida</label>
                  <GoldDatePicker
                    value={form.fecha_salida}
                    onChange={(v) => setReservaField('fecha_salida', v)}
                    minDate={form.fecha_entrada || today}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Monto Anticipo (COP)</label>
                <input type="number" className="form-input" placeholder="Ej. 450000" min="1" step="1" value={form.monto_anticipo} onChange={set('monto_anticipo')} required />
              </div>
              {selectedRoom && noches > 0 && (
                <div className="card" style={{ padding: '1rem', background: 'var(--c-surface-2)' }}>
                  <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Estimado de Reserva</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)' }}>Noches</div>
                      <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>{noches}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)' }}>Tarifa / noche</div>
                      <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>{formatCOP(tarifaNoche)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)' }}>Subtotal</div>
                      <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>{formatCOP(subtotalEstimado)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)' }}>Impuestos estimados (19%)</div>
                      <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>{formatCOP(impuestosEstimados)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)' }}>Anticipo capturado</div>
                      <div style={{ color: 'var(--c-text)', fontWeight: 600 }}>{formatCOP(anticipoCapturado)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)' }}>Saldo estimado</div>
                      <div style={{ color: 'var(--c-gold)', fontWeight: 700 }}>{formatCOP(saldoEstimado)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>Total estimado de la reserva</span>
                    <strong style={{ color: 'var(--c-gold)', fontSize: '1.05rem' }}>{formatCOP(totalEstimado)}</strong>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Token de Pago</label>
                <input type="text" className="form-input" placeholder="Ej. tok_test_001" value={form.token_pago} onChange={set('token_pago')} required />
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.35rem' }}>Identificador generado por la pasarela de pago al autorizar el cobro.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones (opcional)</label>
                <textarea className="form-textarea" placeholder="Preferencias, solicitudes especiales…" value={form.observaciones} onChange={set('observaciones')} />
              </div>
              {result?.type === 'success' && (
                <div className="alert alert-success">
                  Reserva confirmada · Código: <strong>{result.data.codigo_confirmacion ?? result.data.codigo}</strong>
                </div>
              )}
              {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}
              <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
                {loading ? 'Procesando…' : 'Crear Reserva'}
              </button>
            </form>
          </div>
      )}

      {tab === 'cancelar' && canCancel && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Cancelar Reserva</p>
            <span className="gold-line" />
            <p style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', marginBottom: '1.25rem' }}>
              La penalización se calcula según los días restantes hasta la fecha de entrada:
              más de 7 días → sin cargo · 3-7 días → 30% · menos de 3 días → 50% · día del check-in → 100%.
            </p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">ID de Reserva</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej. 1042"
                min="1"
                value={cancelId}
                onChange={(e) => { setCancelId(e.target.value); setCancelInfo(null); }}
              />
            </div>
            <button
              className="btn btn-danger btn-full"
              onClick={handleCancelPreview}
              disabled={cancelLoading || !cancelId}
            >
              Cancelar Reserva
            </button>

            {cancelInfo?.type === 'success' && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                Reserva cancelada. {cancelInfo.data.reembolso !== undefined
                  ? `Reembolso: $${cancelInfo.data.reembolso} · Penalización: $${cancelInfo.data.penalizacion}`
                  : ''}
              </div>
            )}

            <div className="card-gold" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--r-sm)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-gold)', fontWeight: 500, marginBottom: '0.5rem' }}>
                Política de cancelación
              </p>
              {[
                ['Más de 7 días antes', '0% penalización', 'badge-success'],
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

      {/* Confirm Modal */}
      {confirmModal && (
        <Modal title="Confirmar cancelación" onClose={() => setConfirmModal(false)}>
          <p style={{ fontSize: '0.9rem', color: 'var(--c-text-2)', marginBottom: '1rem' }}>
            ¿Está seguro que desea cancelar la reserva <strong style={{ color: 'var(--c-text)' }}>#{cancelId}</strong>?
            Se aplicará la penalización correspondiente según la política de cancelación.
          </p>
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            Esta acción no se puede deshacer.
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setConfirmModal(false)}>Cancelar</button>
            <button className="btn btn-danger" onClick={handleCancelConfirm} disabled={cancelLoading}>
              {cancelLoading ? 'Procesando…' : 'Confirmar cancelación'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
