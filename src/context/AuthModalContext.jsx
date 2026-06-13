import { createContext, useContext, useState, useCallback } from "react";
import LoginModal from "../components/LoginModal.jsx";

/**
 * AuthModalContext — controla la apertura del modal de auth (login/registro)
 * desde cualquier componente del árbol.
 *
 * Uso:
 *   const { openLogin, openRegister } = useAuthModal();
 *   openLogin({ redirectAfter: '/dashboard/reservas', params: { tipo: 'Deluxe' } });
 *   openRegister({ redirectAfter: '/dashboard' });
 *
 * Cuando el login/registro es exitoso, navega a `redirectAfter` con los `params`.
 * El usuario puede alternar entre login y registro dentro del mismo modal sin
 * perder la configuración de redirect.
 */
const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    mode: "login",
    redirectAfter: null,
    params: null,
  });

  const openLogin = useCallback((opts = {}) => {
    setState({
      open: true,
      mode: "login",
      redirectAfter: opts.redirectAfter ?? null,
      params:        opts.params        ?? null,
    });
  }, []);

  const openRegister = useCallback((opts = {}) => {
    setState({
      open: true,
      mode: "register",
      redirectAfter: opts.redirectAfter ?? null,
      params:        opts.params        ?? null,
    });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, mode: "login", redirectAfter: null, params: null });
  }, []);

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister, close }}>
      {children}
      <LoginModal
        open={state.open}
        initialMode={state.mode}
        redirectAfter={state.redirectAfter}
        params={state.params}
        onClose={close}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal debe usarse dentro de <AuthModalProvider>");
  }
  return ctx;
}
