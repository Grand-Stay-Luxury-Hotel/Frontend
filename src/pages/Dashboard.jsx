import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

const PAGE_TITLES = {
  disponibilidad: 'Consulta de Disponibilidad',
  reservas:       'Gestión de Reservas',
  checkin:        'Registro de Check-In',
  checkout:       'Registro de Check-Out',
  consumos:       'Consumos Adicionales',
  habitaciones:   'Estado de Habitaciones',
  inventario:     'Inventario',
  reportes:       'Reportes Estadísticos',
};

export default function Dashboard() {
  const location = useLocation();
  const segment = location.pathname.split('/').pop();
  const title = PAGE_TITLES[segment] ?? 'Dashboard';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="topbar-title">{title}</h1>
        </div>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
