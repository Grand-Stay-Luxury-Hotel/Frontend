import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm.jsx";
import RegisterForm from "./RegisterForm.jsx";
import { IconClose } from "./icons/index.jsx";
import { withParams } from "../utils/routes.js";
import "./LoginModal.css";

/**
 * AuthModal — modal flotante de autenticación con dos vistas internas:
 * login (default) y registro. El usuario puede alternar sin cerrar el modal.
 *
 * No se renderiza desde JSX directamente — se invoca vía useAuthModal().
 *
 * Props:
 *   open           — boolean
 *   onClose        — () => void
 *   redirectAfter  — path al que navegar tras login/registro exitoso (opcional)
 *   params         — objeto plano con query params para el redirect (opcional)
 *   initialMode    — 'login' | 'register' (default 'login')
 */
export default function LoginModal({
  open,
  onClose,
  redirectAfter,
  params,
  initialMode = "login",
}) {
  const navigate      = useNavigate();
  const dialogRef     = useRef(null);
  const previousFocus = useRef(null);
  const [mode, setMode] = useState(initialMode);

  /* Reset del modo cada vez que el modal se abre */
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  /* Tecla Escape cierra el modal */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Bloquear scroll del body + restore de focus */
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    document.body.style.overflow = "hidden";
    setTimeout(() => dialogRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = "";
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleSuccess = () => {
    onClose();
    if (redirectAfter) {
      const path = params ? withParams(redirectAfter, params) : redirectAfter;
      navigate(path, { replace: true });
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isLogin = mode === "login";

  return createPortal(
    <div
      className="login-modal-backdrop"
      onClick={handleBackdrop}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`login-modal-dialog${isLogin ? "" : " login-modal-dialog--wide"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className="login-modal-close"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <IconClose size={18} />
        </button>

        <div className="login-modal-brand">
          <div className="logo">Grand <span>Stay</span></div>
        </div>

        <div id="auth-modal-title" className="login-modal-form">
          {isLogin ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setMode("register")}
              compact
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode("login")}
              compact
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
