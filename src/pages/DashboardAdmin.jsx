import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ─── SVG icons (stroke, estilo Feather / igual que Sidebar) ─ */
const si = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IcoBed      = () => <svg {...si}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v6"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>;
const IcoCircle   = () => <svg {...si}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoArrowIn  = () => <svg {...si}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const IcoArrowOut = () => <svg {...si}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoCalendar = () => <svg {...si}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoAlert    = () => <svg {...si}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

/* ─── paleta ──────────────────────────────────────────────── */
const GOLD   = '#c9a96e';
const GREEN  = '#4ade80';
const RED    = '#f87171';
const BLUE   = '#60a5fa';
const AMBER  = '#fbbf24';
const GRAY   = '#9ca3af';
const PURPLE = '#a78bfa';

const EST_COLOR = {
  disponible:    GREEN,
  ocupada:       RED,
  limpieza:      AMBER,
  mantenimiento: BLUE,
  bloqueada:     GRAY,
};
const EST_LABEL = {
  disponible:    'Disponibles',
  ocupada:       'Ocupadas',
  limpieza:      'En Limpieza',
  mantenimiento: 'Mantenimiento',
  bloqueada:     'Bloqueadas',
};
const CANAL_COLORS = [GOLD, BLUE, PURPLE, GREEN];
const TIPO_COLORS  = [GOLD, BLUE, GREEN, PURPLE, AMBER];

/* ─── helpers de formato ──────────────────────────────────── */
const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtCOP = (v) => `$${fmt(v)}`;

/* ─── tooltip personalizado ───────────────────────────────── */
function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 8,
        padding: '0.6rem 0.9rem',
        fontSize: '0.78rem',
        color: '#f4efe6',
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: '0.3rem', color: GOLD }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {prefix}{fmt(p.value)}{suffix}
        </p>
      ))}
    </div>
  );
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KPICard({ value, label, subtitle, color = GOLD, icon }) {
  return (
    <div
      className="card card-gold"
      style={{ flex: '1 1 150px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '2.4rem', fontFamily: 'var(--f-heading)', fontWeight: 700, color, lineHeight: 1 }}>
          {value}
        </p>
        {icon && (
          <span style={{ color, opacity: 0.7, marginTop: '0.15rem', flexShrink: 0 }}>
            {icon}
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.76rem', color: 'var(--c-text)', fontWeight: 600, marginTop: '0.35rem' }}>
        {label}
      </p>
      {subtitle && (
        <p style={{ fontSize: '0.68rem', color: 'var(--c-text-2)', marginTop: '0.1rem' }}>{subtitle}</p>
      )}
    </div>
  );
}

/* ─── Chart Card wrapper ──────────────────────────────────── */
function ChartCard({ title, subtitle, children, style }) {
  return (
    <div className="card card-gold" style={{ flex: '1 1 380px', minWidth: 0, ...style }}>
      <p style={{ fontFamily: 'var(--f-heading)', color: GOLD, fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: '0.68rem', color: 'var(--c-text-2)', marginBottom: '1rem' }}>{subtitle}</p>
      )}
      {children}
    </div>
  );
}

/* ─── Leyenda pie personalizada ───────────────────────────── */
function PieLegend({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', justifyContent: 'center' }}>
      {items.map(({ label, value, color, pct }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', flex: 1 }}>{label}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--c-text)', fontWeight: 700 }}>{value}</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--c-text-2)', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function DashboardAdmin() {
  const { auth } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.resumen(auth.token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.token]);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <div className="page-header"><h1>Panel General</h1></div>
        <div className="empty-state"><p>No se pudo cargar el resumen del hotel.</p></div>
      </>
    );
  }

  const {
    habitaciones, checkinsPendientes, checkoutsPendientes,
    reservasMes, alertasInventario,
    ingresosMensuales, reservasPorTipo, reservasPorCanal,
  } = data;

  const pct = habitaciones.total > 0
    ? Math.round((habitaciones.ocupada / habitaciones.total) * 100) : 0;

  // Datos para el pie de habitaciones
  const pieData = Object.entries(EST_LABEL)
    .map(([key, label]) => ({ key, label, value: habitaciones[key] ?? 0, color: EST_COLOR[key] }))
    .filter(d => d.value > 0);

  return (
    <>
      <div className="page-header">
        <h1>Panel General</h1>
        <p style={{ color: 'var(--c-text-2)', fontSize: '0.82rem' }}>
          Resumen operativo del hotel — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Fila 1: KPIs ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <KPICard value={habitaciones.disponible}  label="Disponibles"           color={GREEN} icon={<IcoBed />} />
        <KPICard value={habitaciones.ocupada}     label="Ocupadas"              color={RED}   icon={<IcoCircle />}
          subtitle={`${pct}% ocupación`} />
        <KPICard value={checkinsPendientes}       label="Check-ins Hoy"         color={GOLD}  icon={<IcoArrowIn />}
          subtitle={checkinsPendientes === 0 ? 'Sin llegadas pendientes' : 'Llegadas por gestionar'} />
        <KPICard value={checkoutsPendientes}      label="Check-outs Hoy"        color={GOLD}  icon={<IcoArrowOut />}
          subtitle={checkoutsPendientes === 0 ? 'Sin salidas pendientes' : 'Salidas por gestionar'} />
        <KPICard value={reservasMes.total}        label="Reservas este Mes"     color={BLUE}  icon={<IcoCalendar />}
          subtitle={`Ingresos: $${fmt(reservasMes.ingresos)} COP`} />
        <KPICard value={alertasInventario}        label="Alertas Inventario"    color={alertasInventario > 0 ? RED : GREEN} icon={<IcoAlert />}
          subtitle={alertasInventario === 0 ? 'Todos los insumos al día' : 'Insumos bajo stock mínimo'} />
      </div>

      {/* ── Fila 2: Área (ingresos) + Pie (habitaciones) ─────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>

        <ChartCard title="Ingresos y Reservas" subtitle="Últimos 6 meses" style={{ flex: '2 1 420px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ingresosMensuales} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={GOLD}  stopOpacity={0.25} />
                  <stop offset="95%" stopColor={GOLD}  stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradReservas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BLUE}  stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BLUE}  stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="mes" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="ingresos" orientation="right" tick={{ fill: '#888', fontSize: 10 }}
                axisLine={false} tickLine={false} tickFormatter={fmtCOP} width={72} />
              <YAxis yAxisId="reservas" orientation="left"  tick={{ fill: '#888', fontSize: 10 }}
                axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '0.72rem', color: '#aaa', paddingTop: '0.5rem' }}
                formatter={(v) => v === 'ingresos' ? 'Ingresos (COP)' : 'Reservas'}
              />
              <Area yAxisId="reservas" type="monotone" dataKey="reservas" name="reservas"
                stroke={BLUE} fill="url(#gradReservas)" strokeWidth={2} dot={{ r: 3, fill: BLUE }} />
              <Area yAxisId="ingresos" type="monotone" dataKey="ingresos" name="ingresos"
                stroke={GOLD} fill="url(#gradIngresos)" strokeWidth={2} dot={{ r: 3, fill: GOLD }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Estado de Habitaciones" subtitle="Distribución actual" style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                    dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={d.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    fill={GOLD} style={{ fontFamily: 'var(--f-heading)', fontSize: 22, fontWeight: 700 }}>
                    {habitaciones.total}
                  </text>
                  <text x="50%" y="50%" dy={18} textAnchor="middle" dominantBaseline="middle"
                    fill="#888" style={{ fontSize: 10 }}>
                    total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <PieLegend
              items={pieData.map(d => ({
                label: d.label,
                value: d.value,
                color: d.color,
                pct: habitaciones.total > 0 ? Math.round((d.value / habitaciones.total) * 100) : 0,
              }))}
            />
          </div>
        </ChartCard>
      </div>

      {/* ── Fila 3: Barras tipo + Barras canal ───────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

        <ChartCard title="Reservas por Tipo de Habitación" subtitle="Historial total (no canceladas)">
          {reservasPorTipo.length === 0 ? (
            <p style={{ color: 'var(--c-text-2)', fontSize: '0.78rem', padding: '1rem 0' }}>Sin datos disponibles</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reservasPorTipo} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="tipo" tick={{ fill: '#ccc', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip suffix=" reservas" />} />
                <Bar dataKey="total" name="Reservas" radius={[0, 5, 5, 0]}>
                  {reservasPorTipo.map((_, i) => (
                    <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Reservas por Canal" subtitle="Historial total (no canceladas)">
          {reservasPorCanal.length === 0 ? (
            <p style={{ color: 'var(--c-text-2)', fontSize: '0.78rem', padding: '1rem 0' }}>Sin datos disponibles</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reservasPorCanal} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="canal" tick={{ fill: '#ccc', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip suffix=" reservas" />} />
                <Bar dataKey="total" name="Reservas" radius={[5, 5, 0, 0]}>
                  {reservasPorCanal.map((_, i) => (
                    <Cell key={i} fill={CANAL_COLORS[i % CANAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </>
  );
}



