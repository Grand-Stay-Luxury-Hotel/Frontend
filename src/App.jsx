import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider, useToast } from './components/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Disponibilidad from './pages/Disponibilidad.jsx';
import Reservas from './pages/Reservas.jsx';
import CheckIn from './pages/CheckIn.jsx';
import CheckOut from './pages/CheckOut.jsx';
import Consumos from './pages/Consumos.jsx';
import Inventario from './pages/Inventario.jsx';
import Reportes from './pages/Reportes.jsx';
import Habitaciones from './pages/Habitaciones.jsx';
import Tarifas from './pages/Tarifas.jsx';
import CuentaHuesped from './pages/CuentaHuesped.jsx';
import Auditoria from './pages/Auditoria.jsx';
import DashboardAdmin from './pages/DashboardAdmin.jsx';
import { isAdmin, isLimpieza, isTecnico } from './utils/roles.js';

const ROLES = {
  admin: ['Administrador'],
  recepcionista: ['Recepcionista'],
  limpieza: ['PersonalLimpieza', 'Personal de Limpieza', 'Personal de limpieza', 'Personal Limpieza', 'Limpieza'],
  tecnico: ['ServicioTecnico', 'Servicio Tecnico', 'Servicio técnico', 'Servicio tecnico', 'Servicio Técnico'],
  huesped: ['Huesped', 'Huésped'],
};

const LIMPEZA_ROLES = ['PersonalLimpieza', 'Personal de Limpieza', 'Personal de limpieza', 'Personal Limpieza', 'Limpieza'];
const TECNICO_ROLES = ['ServicioTecnico', 'Servicio Tecnico', 'Servicio técnico', 'Servicio tecnico', 'Servicio Técnico'];

function DashboardIndex() {
  const { auth } = useAuth();
  const rol = auth?.rol ?? '';
  if (isAdmin(rol)) return <Navigate to="overview" replace />;
  if (isLimpieza(rol) || isTecnico(rol)) return <Navigate to="habitaciones" replace />;
  return <Navigate to="disponibilidad" replace />;
}

function IdleLogoutListener() {
  const { addToast } = useToast();
  useEffect(() => {
    const handler = () => addToast('Sesión cerrada por inactividad (15 min).', 'warning');
    window.addEventListener('gs:idleLogout', handler);
    return () => window.removeEventListener('gs:idleLogout', handler);
  }, [addToast]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <IdleLogoutListener />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardIndex />} />
              <Route
                path="disponibilidad"
                element={
                  <ProtectedRoute roles={[...ROLES.recepcionista, ...ROLES.huesped]}>
                    <Disponibilidad />
                  </ProtectedRoute>
                }
              />
              <Route
                path="overview"
                element={
                  <ProtectedRoute roles={ROLES.admin}>
                    <DashboardAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reservas"
                element={
                  <ProtectedRoute roles={[...ROLES.recepcionista, ...ROLES.huesped]}>
                    <Reservas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkin"
                element={
                  <ProtectedRoute roles={ROLES.recepcionista}>
                    <CheckIn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute roles={ROLES.recepcionista}>
                    <CheckOut />
                  </ProtectedRoute>
                }
              />
              <Route
                path="consumos"
                element={
                  <ProtectedRoute roles={ROLES.recepcionista}>
                    <Consumos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="habitaciones"
                element={
                  <ProtectedRoute roles={[...ROLES.admin, ...ROLES.recepcionista, ...ROLES.limpieza, ...ROLES.tecnico]}>
                    <Habitaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventario"
                element={
                  <ProtectedRoute roles={[...ROLES.admin, ...ROLES.limpieza]}>
                    <Inventario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reportes"
                element={
                  <ProtectedRoute roles={ROLES.admin}>
                    <Reportes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tarifas"
                element={
                  <ProtectedRoute roles={ROLES.admin}>
                    <Tarifas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cuenta"
                element={
                  <ProtectedRoute roles={ROLES.huesped}>
                    <CuentaHuesped />
                  </ProtectedRoute>
                }
              />
              <Route
                path="auditoria"
                element={
                  <ProtectedRoute roles={ROLES.admin}>
                    <Auditoria />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
