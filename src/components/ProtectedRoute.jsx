import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { hasRole } from '../utils/roles.js';

export default function ProtectedRoute({ children, roles = [] }) {
  const { auth } = useAuth();

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasRole(auth.rol, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
