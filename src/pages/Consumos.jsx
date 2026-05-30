import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function Consumos() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({
    id_reserva:      '',
    id_servicio:     '',
    cantidad:        '1',
    descripcion:     '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Historial de consumos de la reserva buscada
  const [historial, setHistorial] = useState(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    api.servicios.listar(auth.token)
      .then((res) => setServicios(res.data ?? res))
      .catch(() => {});
  }, []);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const servicioSeleccionado = servicios.find((s) => String(s.id_servicio) === String(form.id_servicio));
  const total = servicioSeleccionado && form.cantidad
    ? (Number(servicioSeleccionado.precio) * Number(form.cantidad)).toFixed(2)
    : null;

  const buscarHistorial = useCallback(async () => {
    if (!form.id_reserva.trim()) return;
    setLoadingHistorial(true);
    try {
      const res = await api.consumos.porReserva(form.id_reserva.trim(), auth.token);
      setHistorial(res.data ?? res);
    } catch {
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  }, [form.id_reserva, auth.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_reserva || !form.id_servicio) {
      addToast('Complete todos los campos obligatorios.', 'warning');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        id_reserva:  form.id_reserva.trim(),
        id_servicio: Number(form.id_servicio),
        cantidad:    Number(form.cantidad),
        descripcion: form.descripcion || undefined,
      };
      const data = await api.consumos.registrar(payload, auth.token);
      setResult({ type: 'success', data });
      addToast('Consumo registrado exitosamente.', 'success');
      setForm((f) => ({ ...f, id_servicio: '', cantidad: '1', descripcion: '' }));
      await buscarHistorial();
    } catch (err) {
      setResult({ type: 'error', msg: err.message });
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });

  return (
    <>
      <div className="page-header">
        <h1>Consumos Adicionales</h1>
        <p>Registre los servicios adicionales consumidos durante la estadía</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: historial ? '1fr 1fr' : '1fr', gap: '1.5rem', maxWidth: historial ? 900 : 560 }}>
        {/* â”€â”€ Formulario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Nuevo Consumo</p>
          <span className="gold-line" />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ID o código de reserva</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 42 o GS-2025-000002"
                  value={form.id_reserva}
                  onChange={(e) => { setForm((f) => ({ ...f, id_reserva: e.target.value })); setHistorial(null); }}
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={buscarHistorial}
                  disabled={loadingHistorial || !form.id_reserva.trim()}
                >
                  {loadingHistorial ? '…' : 'Ver historial'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Servicio</label>
              <select
                className="form-select"
                value={form.id_servicio}
                onChange={set('id_servicio')}
                required
              >
                <option value="">— Seleccione el servicio —</option>
                {servicios.map((s) => (
                  <option key={s.id_servicio} value={s.id_servicio}>
                    {s.nombre} · ${fmt(s.precio)} — {s.categoria}
                  </option>
                ))}
              </select>
              {servicioSeleccionado && (
                <p style={{ fontSize: '0.72rem', color: 'var(--c-text-2)', marginTop: '0.3rem' }}>
                  {servicioSeleccionado.categoria} · Precio unitario: <strong>${fmt(servicioSeleccionado.precio)}</strong>
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-input"
                placeholder="1"
                min="1"
                value={form.cantidad}
                onChange={set('cantidad')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción adicional (opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Menú degustación para 2"
                value={form.descripcion}
                onChange={set('descripcion')}
              />
            </div>

            {total && (
              <div className="alert alert-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total calculado:</span>
                <strong style={{ fontSize: '1.1rem' }}>${Number(total).toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP</strong>
              </div>
            )}

            {result?.type === 'success' && (
              <div className="alert alert-success">
                ✓ Consumo registrado.
                {result.data.total !== undefined && <> Total: <strong>${fmt(result.data.total)}</strong></>}
              </div>
            )}
            {result?.type === 'error' && <div className="alert alert-error">{result.msg}</div>}

            <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrar Consumo'}
            </button>
          </form>
        </div>

        {/* â”€â”€ Historial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {historial !== null && (
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
              Historial de Reserva #{form.id_reserva}
            </p>
            <span className="gold-line" />
            {historial.length === 0 ? (
              <p style={{ color: 'var(--c-text-2)', fontSize: '0.85rem', marginTop: '1rem' }}>
                No hay consumos registrados para esta reserva.
              </p>
            ) : (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {historial.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 0', borderBottom: '1px solid var(--c-border)',
                      gap: '0.5rem', flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--c-text)', fontWeight: 500 }}>
                        {c.servicio ?? c.nombre_servicio ?? c.descripcion}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--c-text-3)' }}>
                        {c.tipo ?? c.categoria ?? ''} · Cant: {c.cantidad} · {(c.creado_en ?? c.fecha) ? new Date(c.creado_en ?? c.fecha).toLocaleDateString('es-CO') : ''}
                      </div>
                    </div>
                    <span style={{ color: 'var(--c-gold)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      ${fmt(c.precio_total ?? c.subtotal)}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--c-text)' }}>Total consumos</span>
                  <span style={{ color: 'var(--c-gold)' }}>
                    ${fmt(historial.reduce((acc, c) => acc + Number(c.precio_total ?? c.subtotal ?? 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cards de tipos de servicio ─────────────── */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', maxWidth: 900 }}>
        {[
          { tipo: 'Restaurante', icon: '🍽️', desc: 'Alimentos, bebidas y menús especiales.' },
          { tipo: 'Spa',         icon: '💆', desc: 'Masajes, tratamientos y terapias.' },
          { tipo: 'Lavandería',  icon: '👔', desc: 'Lavado, planchado y cuidado de prendas.' },
          { tipo: 'Minibar',     icon: '🍾', desc: 'Bebidas y snacks del minibar.' },
        ].map((s) => (
          <div key={s.tipo} className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-gold)', marginBottom: '0.25rem' }}>{s.tipo}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--c-text-2)' }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}
