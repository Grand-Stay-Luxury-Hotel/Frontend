import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const AuthContext = createContext(null);
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const idleTimerRef = useRef(null);
  const [auth, setAuth] = useState(() => {
    try {
      const stored = sessionStorage.getItem('gs_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data) => {
    const decoded = decodeToken(data.token ?? '');
    const session = {
      token: data.token,
      email: decoded.email ?? data.email ?? '',
      rol: decoded.rol ?? data.rol ?? '',
      id_usuario: decoded.id_usuario ?? data.id_usuario ?? null,
      id_recepcionista: decoded.id_recepcionista ?? null,
      id_personal: decoded.id_personal ?? null,
      id_admin: decoded.id_admin ?? null,
      id_huesped: decoded.id_huesped ?? null,
    };
    sessionStorage.setItem('gs_auth', JSON.stringify(session));
    setAuth(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('gs_auth');
    setAuth(null);
  }, []);

  useEffect(() => {
    if (!auth?.token) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return undefined;
    }

    const resetInactivityTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [auth?.token, logout]);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
