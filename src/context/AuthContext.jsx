import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
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

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
