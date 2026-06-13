import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { IconCheck, IconAlert, IconClose } from './icons/index.jsx';
import './Toast.css';

const ToastContext = createContext(null);
const DURATION_MS  = 2500;

/* SVG inline para tipo "info" — no estaba en el set centralizado */
function IconInfo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

const ICON_BY_TYPE = {
  success: <IconCheck size={16} />,
  error:   <IconAlert size={16} />,
  warning: <IconAlert size={16} />,
  info:    <IconInfo  size={16} />,
};

function ToastItem({ toast, onClose }) {
  /* Animación de salida 200ms antes de remover del DOM */
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), DURATION_MS - 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`gs-toast gs-toast--${toast.type}${leaving ? ' gs-toast--leaving' : ''}`}
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
    >
      <span className="gs-toast-icon">{ICON_BY_TYPE[toast.type] ?? ICON_BY_TYPE.info}</span>
      <span className="gs-toast-msg">{toast.message}</span>
      <button
        type="button"
        className="gs-toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Cerrar notificación"
      >
        <IconClose size={12} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), DURATION_MS);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="gs-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
