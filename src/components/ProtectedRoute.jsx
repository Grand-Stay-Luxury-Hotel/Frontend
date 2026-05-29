import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, roles = [] }) {
  const { auth } = useAuth();

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(auth.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
