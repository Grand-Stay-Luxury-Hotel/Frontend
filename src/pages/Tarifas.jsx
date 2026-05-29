import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const TEMPORADAS = ['alta', 'media', 'baja'];

const FORM_INIT = {
  id_tipo: '',
  nombre: '',
  temporada: 'media',
  precio_noche: '',
  fecha_inicio: '',
  fecha_fin: '',
  activa: true,
};

export default function Tarifas() {
  const { auth } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INIT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resTipos, resTarifas] = await Promise.all([
        api.habitacionesTipos.listar(auth.token),
        api.tarifas.listar(auth.token),
      ]);
      setTipos(resTipos.data ?? resTipos);
      setTarifas(resTarifas.data ?? resTarifas);
    } catch (e) {
      setError(e.message || 'Error al cargar tarifas');
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setEditId(null);
    setForm(FORM_INIT);
    setFormError('');
    setShowForm(true);
  };

  const abrirEditar = (t) => {
    setEditId(t.id_tarifa);
    setForm({
      id_tipo:     t.id_tipo ?? '',
      nombre:      t.nombre ?? '',
      temporada:   t.temporada ?? 'media',
      precio_noche:t.precio_noche ?? '',
      fecha_inicio:t.fecha_inicio?.slice(0, 10) ?? '',
      fecha_fin:   t.fecha_fin?.slice(0, 10) ?? '',
      activa:      t.activa ?? true,
    });
    setFormError('');
    setShowForm(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.id_tipo || !form.nombre || !form.precio_noche || !form.fecha_inicio || !form.fecha_fin) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        id_tipo:     Number(form.id_tipo),
        nombre:      form.nombre,
        temporada:   form.temporada,
        precio_noche:Number(form.precio_noche),
        fecha_inicio:form.fecha_inicio,
        fecha_fin:   form.fecha_fin,
        activa:      form.activa,
      };
      if (editId) {
        await api.tarifas.actualizar(editId, body, auth.token);
      } else {
        await api.tarifas.crear(body, auth.token);
      }
      setShowForm(false);
      await cargar();
    } catch (e) {
      setFormError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const desactivar = async (id) => {
    if (!window.confirm('¿Desactivar esta tarifa?')) return;
    try {
      await api.tarifas.eliminar(id, auth.token);
      await cargar();
    } catch (e) {
      alert(e.message || 'Error al desactivar');
    }
  };

  const card = {
    background: 'var(--c-surface)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-lg)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const input = {
    width: '100%', background: 'var(--c-surface-2)',
    border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)',
    color: 'var(--c-text)', padding: '0.55rem 0.75rem',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Cabecera ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--f-heading)', fontSize: '1.6rem', color: 'var(--c-text)', marginBottom: '0.25rem' }}>
            Gestión de Tarifas
          </h1>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.85rem' }}>
            Administre las tarifas por tipo de habitación y temporada.
          </p>
        </div>
        <button className="btn btn-gold" onClick={abrirCrear}>+ Nueva Tarifa</button>
      </div>

      {/* ── Error ───────────────────────────────────── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* ── Formulario ──────────────────────────────── */}
      {showForm && (
        <div style={{ ...card, border: '1px solid var(--c-gold-border)', background: 'var(--c-surface-2)' }}>
          <h2 style={{ fontFamily: 'var(--f-heading)', fontSize: '1.1rem', color: 'var(--c-gold)', marginBottom: '1.25rem' }}>
            {editId ? 'Editar Tarifa' : 'Nueva Tarifa'}
          </h2>
          <form onSubmit={guardar}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--c-text-2)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Tipo de Habitación *</label>
                <select
                  style={input}
                  value={form.id_tipo}
                  onChange={(e) => setForm((f) => ({ ...f, id_tipo: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tipos.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--c-text-2)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Nombre de Tarifa *</label>
                <input
                  style={input}
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Tarifa Temporada Alta"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--c-text-2)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Temporada *</label>
                <select
                  style={input}
                  value={form.temporada}
                  onChange={(e) => setForm((f) => ({ ...f, temporada: e.target.value }))}
                >
                  {TEMPORADAS.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--c-text-2)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Precio por Noche *</label>
                <input
                  style={input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_noche}
                  onChange={(e) => setForm((f) => ({ ...f, precio_noche: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--c-text-2)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Fecha Inicio *</label>
                <input
                  style={input}
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--c-text-2)', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Fecha Fin *</label>
                <input
                  style={input}
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--c-text-2)', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))}
                  />
                  Activa
                </label>
              </div>
            </div>
            {formError && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{formError}</p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear Tarifa')}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tabla ───────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--c-text-2)', padding: '3rem' }}>Cargando tarifas...</div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface-3)', borderBottom: '1px solid var(--c-border)' }}>
                {['ID', 'Tipo', 'Nombre', 'Temporada', 'Precio/Noche', 'Vigencia', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--c-text-2)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tarifas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--c-text-3)' }}>
                    No hay tarifas registradas.
                  </td>
                </tr>
              ) : (
                tarifas.map((t) => (
                  <tr
                    key={t.id_tarifa}
                    style={{ borderBottom: '1px solid var(--c-border)' }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--c-text-3)', fontSize: '0.8rem' }}>#{t.id_tarifa}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--c-text)', fontSize: '0.85rem' }}>{t.tipo_nombre ?? '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--c-text)', fontSize: '0.85rem' }}>{t.nombre}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <TemporadaBadge temporada={t.temporada} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--c-gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                      ${Number(t.precio_noche).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--c-text-2)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {t.fecha_inicio?.slice(0, 10)} → {t.fecha_fin?.slice(0, 10)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--r-sm)', fontSize: '0.73rem', fontWeight: 600,
                        background: t.activa ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: t.activa ? '#4ade80' : '#f87171',
                        border: `1px solid ${t.activa ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {t.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => abrirEditar(t)}
                        >
                          Editar
                        </button>
                        {t.activa && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                            onClick={() => desactivar(t.id_tarifa)}
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TemporadaBadge({ temporada }) {
  const colors = {
    alta:  { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  text: '#f87171' },
    media: { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.3)',  text: '#facc15' },
    baja:  { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80' },
  };
  const c = colors[temporada] || colors.media;
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem',
      borderRadius: 'var(--r-sm)', fontSize: '0.73rem', fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {temporada ? temporada.charAt(0).toUpperCase() + temporada.slice(1) : '—'}
    </span>
  );
}
