import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { ROLE_LABELS as ROLE_LABEL_MAP, hasRole, isAdmin, normalizeRole, ROLES } from '../utils/roles.js';
import {
  IconCalendar,
  IconBook,
  IconLogin,
  IconLogout,
  IconCoffee,
  IconBedSimple as IconBed,
  IconBox,
  IconChart,
  IconTag,
  IconShield,
  IconUser,
  IconGrid,
} from './icons/index.jsx';

const ROLE_LABELS = {
  Administrador: 'Administrador',
  Recepcionista: 'Recepcionista',
  Huesped: 'Huésped',
  PersonalLimpieza: 'Personal de Limpieza',
  'Personal de Limpieza': 'Personal de Limpieza',
  Limpieza: 'Personal de Limpieza',
};

function NavItem({ to, icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && <span className="sidebar-badge">{badge}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const rol = auth?.rol ?? '';
  const rolKey = normalizeRole(rol);
  const admin = isAdmin(rol);

  const [alertCount, setAlertCount] = useState(0);
  useEffect(() => {
    if (!admin || !auth?.token) return;
    api.inventario.alertas(auth.token)
      .then(data => setAlertCount((data.data ?? data.alertas ?? []).length))
      .catch(() => {});
  }, [admin, auth?.token]);

  const handleLogout = () => {
    /* Navegamos a la landing y luego invalidamos el token.
       ProtectedRoute usa un sessionStorage flag para no abrir modal
       en el logout intencional. */
    sessionStorage.setItem('gs_intentional_logout', '1');
    navigate('/', { replace: true });
    setTimeout(() => logout(), 0);
  };

  const MENU_SECTIONS = [
    {
      label: 'General',
      items: [
        { to: '/dashboard/overview', label: 'Panel General', icon: <IconGrid />, roles: ROLES.admin },
        { to: '/dashboard/disponibilidad', label: 'Disponibilidad', icon: <IconCalendar />, roles: [...ROLES.recepcionista, ...ROLES.huesped] },
      ]
    },
    {
      label: 'Reservas',
      items: [
        { to: '/dashboard/reservas', label: 'Reservas', icon: <IconBook />, roles: [...ROLES.recepcionista, ...ROLES.huesped] }
      ]
    },
    {
      label: 'Operaciones',
      items: [
        { to: '/dashboard/checkin', label: 'Check-In', icon: <IconLogin />, roles: ROLES.recepcionista },
        { to: '/dashboard/checkout', label: 'Check-Out', icon: <IconLogout />, roles: ROLES.recepcionista },
        { to: '/dashboard/consumos', label: 'Consumos', icon: <IconCoffee />, roles: ROLES.recepcionista },
      ]
    },
    {
      label: 'Habitaciones',
      items: [
        { to: '/dashboard/habitaciones', label: 'Estado de Hab.', icon: <IconBed />, roles: [...ROLES.admin, ...ROLES.recepcionista, ...ROLES.limpieza, ...ROLES.tecnico] }
      ]
    },
    {
      label: 'Inventario',
      items: [
        { to: '/dashboard/inventario', label: 'Inventario', icon: <IconBox />, roles: [...ROLES.admin, ...ROLES.limpieza], hasBadge: true }
      ]
    },
    {
      label: 'Administración',
      items: [
        { to: '/dashboard/reportes', label: 'Reportes', icon: <IconChart />, roles: ROLES.admin },
        { to: '/dashboard/tarifas', label: 'Tarifas', icon: <IconTag />, roles: ROLES.admin },
        { to: '/dashboard/auditoria', label: 'Auditoría', icon: <IconShield />, roles: ROLES.admin },
      ]
    },
    {
      label: 'Mi Cuenta',
      items: [
        { to: '/dashboard/cuenta', label: 'Mi Cuenta', icon: <IconUser />, roles: ROLES.huesped }
      ]
    }
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <Link
          to="/"
          className="sidebar-logo"
          title="Volver al sitio público"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: '0.25rem' }}
        >
          Grand <span>Stay</span>
        </Link>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{auth?.email ?? 'Usuario'}</div>
          <div className="sidebar-user-role">{ROLE_LABEL_MAP[rolKey] ?? ROLE_LABELS[rol] ?? rol}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => hasRole(rol, item.roles));
          if (visibleItems.length === 0) return null;
          return (
            <div className="sidebar-nav-section" key={section.label}>
              <div className="sidebar-nav-label">{section.label}</div>
              {visibleItems.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  badge={item.hasBadge && admin ? alertCount : 0}
                />
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout}>
          <IconLogout /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
/* ─── INLINE SVG ICONS ──────────────────────────────────────── */

