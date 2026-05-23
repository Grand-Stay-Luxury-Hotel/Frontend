import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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

const ROLES = {
  recepcionista: ['Recepcionista'],
  admin: ['Administrador'],
  limpieza: ['PersonalLimpieza', 'Personal de Limpieza', 'Limpieza'],
  adminLimpieza: ['Administrador', 'PersonalLimpieza', 'Personal de Limpieza', 'Limpieza'],
  recepAdminHuesped: ['Recepcionista', 'Administrador', 'Huesped'],
  recepAdmin: ['Recepcionista', 'Administrador'],
  recepAdminLimpieza: ['Recepcionista', 'Administrador', 'PersonalLimpieza', 'Personal de Limpieza', 'Limpieza'],
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
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
              <Route index element={<Navigate to="disponibilidad" replace />} />
              <Route path="disponibilidad" element={<Disponibilidad />} />
              <Route
                path="reservas"
                element={
                  <ProtectedRoute roles={ROLES.recepAdminHuesped}>
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
                  <ProtectedRoute roles={ROLES.recepAdminLimpieza}>
                    <Habitaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventario"
                element={
                  <ProtectedRoute roles={ROLES.adminLimpieza}>
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
                path="cuenta-huesped"
                element={
                  <ProtectedRoute roles={ROLES.recepAdminHuesped}>
                    <CuentaHuesped />
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
