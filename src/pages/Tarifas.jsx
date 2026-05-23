import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const TEMPORADAS = ['baja', 'media', 'alta', 'especial'];

function formatCOP(value) {
  return Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function haySolape(aInicio, aFin, bInicio, bFin) {
  return new Date(aInicio) <= new Date(bFin) && new Date(bInicio) <= new Date(aFin);
}

export default function Tarifas() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notAvailable, setNotAvailable] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id_tipo: '',
    nombre: '',
    precio_noche: '',
    temporada: 'media',
    fecha_inicio: '',
    fecha_fin: '',
    activa: true,
  });

  const setF = (field) => (e) => {
    const value = field === 'activa' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      id_tipo: '',
      nombre: '',
      precio_noche: '',
      temporada: 'media',
      fecha_inicio: '',
      fecha_fin: '',
      activa: true,
    });
  };

  const loadTarifas = useCallback(async () => {
    setLoading(true);
    setNotAvailable(false);
    try {
      const data = await api.tarifas.listar(auth.token);
      const list = data.tarifas ?? data.data ?? data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.status === 404) {
        setNotAvailable(true);
      } else {
        addToast(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [auth.token, addToast]);

  useEffect(() => {
    loadTarifas();
  }, [loadTarifas]);

  const tarifasMismoTipo = useMemo(
    () => rows.filter((r) => Number(r.id_tipo) === Number(form.id_tipo) && Number(r.id_tarifa) !== Number(editingId)),
    [rows, form.id_tipo, editingId],
  );

  const validateForm = () => {
    if (!form.id_tipo || !form.nombre || !form.precio_noche || !form.fecha_inicio || !form.fecha_fin) {
      addToast('Complete todos los campos obligatorios.', 'warning');
      return false;
    }
    if (new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
      addToast('La fecha fin no puede ser menor que la fecha inicio.', 'warning');
      return false;
    }

    const overlap = tarifasMismoTipo.some((r) =>
      haySolape(form.fecha_inicio, form.fecha_fin, r.fecha_inicio, r.fecha_fin),
    );

    if (overlap) {
      addToast('Existe solapamiento de fechas con otra tarifa del mismo tipo.', 'warning');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        id_tipo: Number(form.id_tipo),
        nombre: form.nombre.trim(),
        precio_noche: Number(form.precio_noche),
        temporada: form.temporada,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        activa: !!form.activa,
      };

      if (editingId) {
        await api.tarifas.actualizar(editingId, payload, auth.token);
        addToast('Tarifa actualizada.', 'success');
      } else {
        await api.tarifas.crear(payload, auth.token);
        addToast('Tarifa creada.', 'success');
      }

      resetForm();
      await loadTarifas();
    } catch (err) {
      if (err.status === 404) {
        setNotAvailable(true);
      }
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const editTarifa = (row) => {
    setEditingId(row.id_tarifa);
    setForm({
      id_tipo: String(row.id_tipo ?? ''),
      nombre: row.nombre ?? '',
      precio_noche: String(row.precio_noche ?? ''),
      temporada: row.temporada ?? 'media',
      fecha_inicio: (row.fecha_inicio ?? '').slice(0, 10),
      fecha_fin: (row.fecha_fin ?? '').slice(0, 10),
      activa: row.activa !== false,
    });
  };

  const deleteTarifa = async (id) => {
    const ok = window.confirm('¿Desea eliminar esta tarifa?');
    if (!ok) return;

    try {
      await api.tarifas.eliminar(id, auth.token);
      addToast('Tarifa eliminada.', 'success');
      await loadTarifas();
    } catch (err) {
      if (err.status === 404) {
        setNotAvailable(true);
      }
      addToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Tarifas de Temporada</h1>
        <p>Gestione tarifas por tipo de habitación y período, con validación de solapamientos.</p>
      </div>

      {notAvailable && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          El backend aún no expone endpoints de tarifas. La pantalla ya está lista en frontend.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr', gap: '1.25rem' }}>
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>{editingId ? 'Editar Tarifa' : 'Nueva Tarifa'}</p>
          <span className="gold-line" />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ID Tipo Habitación</label>
              <input className="form-input" type="number" min="1" value={form.id_tipo} onChange={setF('id_tipo')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre Tarifa</label>
              <input className="form-input" value={form.nombre} onChange={setF('nombre')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Precio por Noche (COP)</label>
              <input className="form-input" type="number" min="0" step="1" value={form.precio_noche} onChange={setF('precio_noche')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Temporada</label>
              <select className="form-select" value={form.temporada} onChange={setF('temporada')}>
                {TEMPORADAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Fecha Inicio</label>
                <input className="form-input" type="date" value={form.fecha_inicio} onChange={setF('fecha_inicio')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Fin</label>
                <input className="form-input" type="date" value={form.fecha_fin} onChange={setF('fecha_fin')} required />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--c-text-2)' }}>
              <input type="checkbox" checked={form.activa} onChange={setF('activa')} />
              Tarifa activa
            </label>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-gold" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancelar</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p className="eyebrow">Tarifas Registradas</p>
            <button className="btn btn-outline btn-sm" onClick={loadTarifas} disabled={loading}>
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : rows.length === 0 ? (
            <div className="empty-state"><p>No hay tarifas para mostrar.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Temporada</th>
                    <th>Vigencia</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id_tarifa}>
                      <td>{r.id_tarifa}</td>
                      <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{r.nombre}</td>
                      <td>{r.id_tipo}</td>
                      <td>{r.temporada}</td>
                      <td>{String(r.fecha_inicio).slice(0, 10)} a {String(r.fecha_fin).slice(0, 10)}</td>
                      <td>{formatCOP(r.precio_noche)}</td>
                      <td>
                        <span className={`badge ${r.activa ? 'badge-success' : 'badge-info'}`}>
                          {r.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => editTarifa(r)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTarifa(r.id_tarifa)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
