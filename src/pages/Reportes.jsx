import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import GoldDatePicker from '../components/GoldDatePicker.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const GOLD   = '#c9a96e';
const GOLD2  = '#e8d5a3';
const DARK   = '#1a1a1a';
const COLORS = ['#c9a96e', '#e8d5a3', '#a07840', '#8b6914', '#6b4f10'];

const now = new Date();
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ── Custom Tooltip ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1206', border: '1px solid var(--c-gold)', borderRadius: 6, padding: '0.6rem 0.9rem', fontSize: '0.78rem' }}>
      <p style={{ color: 'var(--c-gold)', marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: '#f4efe6' }}>{p.name}: <strong>{typeof p.value === 'number' && p.name.toLowerCase().includes('%') ? `${p.value}%` : p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Reportes() {
  const { auth } = useAuth();
  const { addToast } = useToast();

  const [tab, setTab] = useState('ocupacion');

  /* ── OCUPACIÓN ───────────────────────────────────────── */
  const [ocForm, setOcForm] = useState({ mes: now.getMonth() + 1, anio: now.getFullYear() });
  const [ocData, setOcData] = useState(null);
  const [ocLoading, setOcLoading] = useState(false);

  const setOc = (f) => (e) => setOcForm((p) => ({ ...p, [f]: Number(e.target.value) }));

  const fetchOcupacion = useCallback(async () => {
    setOcLoading(true);
    setOcData(null);
    try {
      const res = await api.reportes.ocupacion({ mes: ocForm.mes, anio: ocForm.anio }, auth.token);
      setOcData(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setOcLoading(false);
    }
  }, [ocForm, auth.token, addToast]);

  const ocChartData = ocData?.data?.map((r) => ({
    name:  r.tipo_habitacion ?? r.tipo,
    '%':   r.porcentaje_ocupacion ?? r.porcentaje,
    noches: r.noches_ocupadas,
  })) ?? [];

  /* ── INGRESOS ────────────────────────────────────────── */
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const [ingForm, setIngForm] = useState({ fechaInicio: firstOfMonth, fechaFin: today });
  const [ingData, setIngData] = useState(null);
  const [ingLoading, setIngLoading] = useState(false);

  const setIng = (f) => (e) => setIngForm((p) => ({ ...p, [f]: e.target.value }));

  const fetchIngresos = useCallback(async () => {
    setIngLoading(true);
    setIngData(null);
    try {
      const res = await api.reportes.ingresos(ingForm, auth.token);
      setIngData(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIngLoading(false);
    }
  }, [ingForm, auth.token, addToast]);

  // Normalize ingresos data for pie chart
  const ingChartData = (() => {
    if (!ingData) return [];
    let flat = [];
    if (Array.isArray(ingData.data)) {
      flat = ingData.data;
    } else if (ingData.data && typeof ingData.data === 'object') {
      const habs = (ingData.data.habitaciones ?? []).map((h) => ({
        tipo_habitacion: h.tipo_habitacion,
        ingresos: h.ingresos,
      }));
      const servs = (ingData.data.servicios_adicionales ?? []).map((s) => ({
        categoria: s.tipo_servicio,
        ingresos: s.ingresos,
      }));
      flat = [...habs, ...servs];
    } else if (Array.isArray(ingData.ingresos)) {
      flat = ingData.ingresos;
    }
    // Could be grouped by tipo_habitacion + categoria
    const map = {};
    for (const r of flat) {
      const key = r.categoria ?? r.tipo ?? r.tipo_habitacion ?? 'Otro';
      map[key] = (map[key] ?? 0) + Number(r.total ?? r.ingresos ?? r.monto ?? 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const totalIngresos = ingChartData.reduce((acc, r) => acc + r.value, 0);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Reportes Ejecutivos</h1>
          <p>Análisis mensual de ocupación e ingresos por tipo de habitación</p>
        </div>
        <button
          className="btn btn-outline btn-sm no-print"
          onClick={() => window.print()}
          title="Exportar reporte como PDF usando el diálogo de impresión del navegador"
        >
          ↓ Exportar PDF
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--c-border)', paddingBottom: 0 }}>
        {[{ id: 'ocupacion', label: 'Ocupación Mensual' }, { id: 'ingresos', label: 'Ingresos por Período' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: tab === t.id ? 'var(--c-gold)' : 'var(--c-text-2)',
              borderBottom: tab === t.id ? '2px solid var(--c-gold)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OCUPACIÓN TAB ──────────────────────────────── */}
      {tab === 'ocupacion' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
                <label className="form-label">Mes</label>
                <select className="form-select" value={ocForm.mes} onChange={setOc('mes')}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 110, margin: 0 }}>
                <label className="form-label">Año</label>
                <input type="number" className="form-input" min="2020" max={now.getFullYear() + 1} value={ocForm.anio} onChange={setOc('anio')} />
              </div>
              <button className="btn btn-gold" style={{ marginBottom: '0.1rem' }} onClick={fetchOcupacion} disabled={ocLoading}>
                {ocLoading ? 'Cargando…' : 'Generar'}
              </button>
            </div>
          </div>

          {ocLoading && <div className="spinner-wrap"><div className="spinner" /></div>}

          {ocData && !ocLoading && (
            <>
              <div className="card-gold card" style={{ marginBottom: '1.25rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 1.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-2)' }}>Período:</span>
                <strong style={{ color: 'var(--c-gold)' }}>{MONTHS[ocForm.mes - 1]} {ocForm.anio}</strong>
              </div>

              {ocChartData.length > 0 ? (
                <>
                  <div className="chart-wrap">
                    <p className="chart-title">Porcentaje de ocupación por tipo de habitación</p>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={ocChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a1a" />
                        <XAxis dataKey="name" tick={{ fill: '#a09070', fontSize: 12 }} />
                        <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#a09070', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="%" name="Ocupación %" radius={[4, 4, 0, 0]}>
                          {ocChartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? GOLD : GOLD2} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="table-wrap" style={{ marginTop: '1.5rem' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Tipo de Habitación</th>
                          <th>Habitaciones</th>
                          <th>Noches Ocupadas</th>
                          <th>% Ocupación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ocData.data ?? []).map((r) => (
                          <tr key={r.tipo_habitacion ?? r.tipo}>
                            <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{r.tipo_habitacion ?? r.tipo}</td>
                            <td>{r.habitaciones}</td>
                            <td>{r.noches_ocupadas}</td>
                            <td>
                              <span className={`badge ${r.porcentaje_ocupacion >= 80 ? 'badge-success' : r.porcentaje_ocupacion >= 50 ? 'badge-warning' : 'badge-error'}`}>
                                {r.porcentaje_ocupacion ?? r.porcentaje}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="empty-state"><p>Sin datos de ocupación para el período seleccionado.</p></div>
              )}
            </>
          )}
        </>
      )}

      {/* ── INGRESOS TAB ──────────────────────────────── */}
      {tab === 'ingresos' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 500 }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 150, margin: 0 }}>
                <label className="form-label">Fecha Inicio</label>
                <GoldDatePicker
                  value={ingForm.fechaInicio}
                  onChange={(v) => setIngForm((p) => ({ ...p, fechaInicio: v }))}
                  maxDate={ingForm.fechaFin}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 150, margin: 0 }}>
                <label className="form-label">Fecha Fin</label>
                <GoldDatePicker
                  value={ingForm.fechaFin}
                  onChange={(v) => setIngForm((p) => ({ ...p, fechaFin: v }))}
                  minDate={ingForm.fechaInicio}
                  maxDate={today}
                />
              </div>
              <button className="btn btn-gold" style={{ marginBottom: '0.1rem' }} onClick={fetchIngresos} disabled={ingLoading}>
                {ingLoading ? 'Cargando…' : 'Generar'}
              </button>
            </div>
          </div>

          {ingLoading && <div className="spinner-wrap"><div className="spinner" /></div>}

          {ingData && !ingLoading && (
            <>
              <div className="card-gold card" style={{ marginBottom: '1.25rem', display: 'inline-flex', gap: '1.5rem', padding: '0.6rem 1.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-2)' }}>Total ingresos:</span>
                <strong style={{ color: 'var(--c-gold)', fontSize: '1.1rem' }}>${totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong>
              </div>

              {ingChartData.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="chart-wrap">
                    <p className="chart-title">Distribución de ingresos por categoría</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ingChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {ingChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `$${v.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`} contentStyle={{ background: '#1a1206', border: '1px solid var(--c-gold)', borderRadius: 6, fontSize: '0.78rem' }} />
                        <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: '#a09070' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Total (COP)</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ingChartData.map((r) => (
                          <tr key={r.name}>
                            <td style={{ color: 'var(--c-text)', fontWeight: 500 }}>{r.name}</td>
                            <td>${r.value.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                            <td>
                              <span className="badge badge-gold">
                                {totalIngresos > 0 ? ((r.value / totalIngresos) * 100).toFixed(1) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="empty-state"><p>Sin datos de ingresos para el período seleccionado.</p></div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
