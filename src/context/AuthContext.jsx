import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const AuthContext = createContext(null);
const IDLE_MS = 15 * 60 * 1000; // 15 minutos de inactividad

function decodeToken(token) {
  try {
    const segment = token.split('.')[1] ?? '';
    const payload = segment
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(segment.length / 4) * 4, '=');
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = sessionStorage.getItem('gs_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const authRef = useRef(auth);
  useEffect(() => { authRef.current = auth; }, [auth]);
  const idleTimer = useRef(null);

  const login = useCallback((data) => {
    const decoded = decodeToken(data.token ?? '');
    const usuario = data.usuario ?? {};
    const session = {
      token: data.token,
      email: decoded.email ?? data.email ?? usuario.email ?? '',
      rol: decoded.rol ?? data.rol ?? usuario.rol ?? '',
      id_usuario: decoded.id_usuario ?? data.id_usuario ?? usuario.id_usuario ?? null,
      id_recepcionista: decoded.id_recepcionista ?? usuario.id_recepcionista ?? null,
      id_personal: decoded.id_personal ?? usuario.id_personal ?? null,
      id_admin: decoded.id_admin ?? usuario.id_admin ?? null,
      id_huesped: decoded.id_huesped ?? usuario.id_huesped ?? null,
    };
    sessionStorage.setItem('gs_auth', JSON.stringify(session));
    setAuth(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('gs_auth');
    setAuth(null);
  }, []);

  // Idle-timeout: cierra sesión automáticamente tras 15 min de inactividad
  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (authRef.current) {
      idleTimer.current = setTimeout(() => {
        sessionStorage.setItem('gs_intentional_logout', '1');
        window.dispatchEvent(new CustomEvent('gs:idleLogout'));
        sessionStorage.removeItem('gs_auth');
        setAuth(null);
      }, IDLE_MS);
    }
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
      clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
