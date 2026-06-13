import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "./Toast.jsx";
import { api } from "../services/api.js";
import { ROUTES } from "../utils/routes.js";

/**
 * LoginForm — formulario reutilizable de login.
 *
 * Se usa tanto en la página /login como dentro del LoginModal,
 * para no duplicar la lógica de OTP, validación y manejo de errores.
 *
 * Props:
 *   onSuccess(session)  — callback al login exitoso (recibe la sesión)
 *   onSwitchToRegister  — opcional. Si está presente, renderiza un botón
 *                         "Crear cuenta" que invoca esta función. Si no,
 *                         renderiza un Link normal a /registro.
 *   compact             — boolean; reduce paddings y oculta el "volver al inicio"
 */
export default function LoginForm({ onSuccess, onSwitchToRegister, compact = false }) {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [form, setForm]       = useState({ usuario: "", password: "", otp: "" });
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await api.auth.login({
        usuario:  form.usuario,
        password: form.password,
        otp:      showOtp ? form.otp : undefined,
      });
      const session = login(data);
      addToast(`Bienvenido, ${session.email}`, "success");
      onSuccess?.(session);
    } catch (err) {
      const msg   = err?.message ?? "Error al iniciar sesión";
      const lower = msg.toLowerCase();
      if (lower.includes("otp") && !showOtp) {
        setShowOtp(true);
        setInfo("Ingrese el código OTP del administrador para completar el inicio de sesión.");
        addToast("Se requiere código OTP para Administrador.", "info");
      } else if (lower.includes("otp")) {
        setError("Código OTP incorrecto o vencido.");
      } else if (err?.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="login-title">
        {showOtp ? "Verificación adicional" : "Bienvenido"}
      </h1>
      <p className="login-sub">
        {showOtp
          ? "Ingrese el código de un solo uso enviado al administrador"
          : "Acceda a su portal de gestión hotelera"}
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        {!showOtp && (
          <>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-input"
                placeholder="usuario@grandstay.com"
                value={form.usuario}
                onChange={set("usuario")}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                autoComplete="current-password"
                required
              />
            </div>
          </>
        )}

        {showOtp && (
          <>
            <div
              style={{
                background: "var(--c-gold-bg)",
                border: "1px solid var(--c-gold-border)",
                borderRadius: "var(--r-md)",
                padding: "0.75rem 1rem",
                fontSize: "0.82rem",
                color: "var(--c-text-2)",
                marginBottom: "0.25rem",
              }}
            >
              Credenciales verificadas. Complete la autenticación de dos factores para continuar.
            </div>
            <div className="form-group">
              <label className="form-label">Código OTP</label>
              <input
                type="text"
                className="form-input"
                placeholder="000000"
                value={form.otp}
                onChange={set("otp")}
                maxLength={8}
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setError("");
                setInfo("");
                setForm((f) => ({ ...f, otp: "" }));
              }}
              style={{
                background: "none",
                color: "var(--c-text-2)",
                fontSize: "0.78rem",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              ← Volver a credenciales
            </button>
          </>
        )}

        {info  && <div className="alert alert-info">{info}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
          {loading
            ? showOtp ? "Verificando…" : "Iniciando sesión…"
            : showOtp ? "Verificar código" : "Iniciar Sesión"}
        </button>
      </form>

      <p className="login-back" style={{ marginTop: "1.25rem", textAlign: "center" }}>
        ¿Primera vez?{" "}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: "none",
              border: "none",
              color: "var(--c-gold)",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
              textDecoration: "underline",
            }}
          >
            Crea tu cuenta
          </button>
        ) : (
          <Link to={ROUTES.REGISTRO} style={{ color: "var(--c-gold)" }}>
            Crea tu cuenta
          </Link>
        )}
      </p>

      {!compact && (
        <p className="login-back">
          <Link to={ROUTES.HOME}>← Volver al inicio</Link>
        </p>
      )}
    </>
  );
}
