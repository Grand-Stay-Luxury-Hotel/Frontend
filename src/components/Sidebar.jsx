import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABELS = {
  Administrador: 'Administrador',
  Recepcionista: 'Recepcionista',
  Huesped: 'Huésped',
  PersonalLimpieza: 'Personal de Limpieza',
  'Personal de Limpieza': 'Personal de Limpieza',
  Limpieza: 'Personal de Limpieza',
};

const LIMPEZA_ROLES = ['PersonalLimpieza', 'Personal de Limpieza', 'Limpieza'];

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const rol = auth?.rol ?? '';
  const isAdmin      = rol === 'Administrador';
  const isRecep      = rol === 'Recepcionista';
  const isHuesped    = rol === 'Huesped';
  const isLimpieza   = LIMPEZA_ROLES.includes(rol);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Grand <span>Stay</span></div>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{auth?.email ?? 'Usuario'}</div>
          <div className="sidebar-user-role">{ROLE_LABELS[rol] ?? rol}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-label">General</div>
          <NavItem to="/dashboard/disponibilidad" label="Disponibilidad" icon={<IconCalendar />} />
        </div>

        {(isAdmin || isRecep || isHuesped) && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Reservas</div>
            <NavItem to="/dashboard/reservas" label="Reservas" icon={<IconBook />} />
          </div>
        )}

        {isRecep && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Operaciones</div>
            <NavItem to="/dashboard/checkin"  label="Check-In"  icon={<IconLogin />} />
            <NavItem to="/dashboard/checkout" label="Check-Out" icon={<IconLogout />} />
            <NavItem to="/dashboard/consumos" label="Consumos"  icon={<IconCoffee />} />
          </div>
        )}

        {(isAdmin || isRecep || isLimpieza) && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Habitaciones</div>
            <NavItem to="/dashboard/habitaciones" label="Estado de Hab." icon={<IconBed />} />
          </div>
        )}

        {(isAdmin || isLimpieza) && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Inventario</div>
            <NavItem to="/dashboard/inventario" label="Inventario" icon={<IconBox />} />
          </div>
        )}

        {isAdmin && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Administración</div>
            <NavItem to="/dashboard/reportes" label="Reportes" icon={<IconChart />} />
            <NavItem to="/dashboard/tarifas" label="Tarifas" icon={<IconTag />} />
          </div>
        )}

        {(isAdmin || isRecep || isHuesped) && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Cuenta</div>
            <NavItem to="/dashboard/cuenta-huesped" label="Cuenta del Huésped" icon={<IconWallet />} />
          </div>
        )}
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
const s = { width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconCalendar = () => (<svg {...s} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IconBook     = () => (<svg {...s} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
const IconLogin    = () => (<svg {...s} viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>);
const IconLogout   = () => (<svg {...s} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconCoffee   = () => (<svg {...s} viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>);
const IconBed      = () => (<svg {...s} viewBox="0 0 24 24"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v6"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>);
const IconBox      = () => (<svg {...s} viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconChart    = () => (<svg {...s} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>);
const IconTag      = () => (<svg {...s} viewBox="0 0 24 24"><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59A2 2 0 0 0 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
const IconWallet   = () => (<svg {...s} viewBox="0 0 24 24"><path d="M21 7H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 13h4"/><path d="M3 7V5a2 2 0 0 1 2-2h13"/></svg>);
