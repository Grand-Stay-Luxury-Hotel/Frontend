import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { calcularPenalizacion } from '../utils/penalizacion.js';
import GoldDatePicker from '../components/GoldDatePicker.jsx';

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
  const [cancelId, setCancelId]   = useState('');
  const [cancelInfo, setCancelInfo] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

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
      setForm((f) => ({ ...f, id_huesped: '', id_habitacion: prefill.room?.id_habitacion ?? '', token_pago: '', monto_anticipo: '', observaciones: '' }));
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
    } catch (err) {
      addToast(err.message, 'error');
      setConfirmModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const canCreate = auth.rol === 'Recepcionista' || auth.rol === 'Huesped' || auth.rol === 'Administrador';
  const canCancel = auth.rol === 'Recepcionista' || auth.rol === 'Administrador';

  return (
    <>
      <div className="page-header">
        <h1>Gestión de Reservas</h1>
        <p>Cree una nueva reserva o gestione cancelaciones según la política de penalización vigente</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canCancel ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

        {/* ── CREATE ──────────────────────────────── */}
        {canCreate && (
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
                <label className="form-label">ID Huésped</label>
                {auth.rol === 'Huesped' ? (
                  <input type="text" className="form-input" value={`#${form.id_huesped} — cuenta propia`} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                ) : (
                  <input type="number" className="form-input" placeholder="ID del huésped" min="1" value={form.id_huesped} onChange={set('id_huesped')} required />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">ID Habitación</label>
                <input type="number" className="form-input" placeholder="ID de la habitación" min="1" value={form.id_habitacion} onChange={set('id_habitacion')} required />
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

        {/* ── CANCEL ──────────────────────────────── */}
        {canCancel && (
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
      </div>

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
