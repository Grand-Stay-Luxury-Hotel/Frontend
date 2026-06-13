import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';
import { hasRole } from '../utils/roles.js';
import { ROUTES } from '../utils/routes.js';

/**
 * ProtectedRoute — guard de rutas autenticadas.
 *
 * Sin token: redirige a Landing y abre el modal de login con la ruta
 * original como redirectAfter (preserva deep links).
 *
 * Con token pero sin rol válido: redirige al dashboard base.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { auth } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();
  const triggered = useRef(false);

  /* Si no hay token, abrimos el modal una sola vez con el redirect intacto.
     Excepción: si el flag de logout intencional está presente, lo consumimos
     sin abrir el modal — el usuario salió conscientemente. */
  useEffect(() => {
    if (!auth?.token && !triggered.current) {
      triggered.current = true;
      const intentional = sessionStorage.getItem('gs_intentional_logout');
      if (intentional) {
        sessionStorage.removeItem('gs_intentional_logout');
        return;
      }
      const search = location.search;
      const fullPath = location.pathname + (search ?? '');
      openLogin({
        redirectAfter: fullPath,
        params: null,
      });
    }
  }, [auth?.token, location.pathname, location.search, openLogin]);

  if (!auth?.token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (roles.length > 0 && !hasRole(auth.rol, roles)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}
