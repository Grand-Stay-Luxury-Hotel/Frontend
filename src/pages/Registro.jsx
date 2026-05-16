import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export default function Registro() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmar_password: '',
    telefono: '',
    num_documento: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.registro({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        telefono: form.telefono || undefined,
        num_documento: form.num_documento,
      });
      login(data);
      addToast(`Bienvenido a Grand Stay, ${form.nombre}!`, 'success');
      navigate('/dashboard/disponibilidad', { replace: true });
    } catch (err) {
      setError(err?.message ?? 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT — image */}
      <div className="login-image">
        <p className="login-image-quote">
          "Un gran viaje comienza con<br />
          una gran bienvenida."
        </p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem', letterSpacing: '0.08em' }}>
          — Grand Stay Hotels
        </p>
      </div>

      {/* RIGHT — form */}
      <div className="login-form-panel">
        <div className="login-brand">
          <div className="logo">Grand <span>Stay</span></div>
        </div>

        <h1 className="login-title">Crea tu cuenta</h1>
        <p className="login-sub">Únete a Grand Stay y vive una experiencia única</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Juan"
                value={form.nombre}
                onChange={set('nombre')}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input
                type="text"
                className="form-input"
                placeholder="García"
                value={form.apellido}
                onChange={set('apellido')}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico *</label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Mín. 8 caracteres"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repite tu contraseña"
                value={form.confirmar_password}
                onChange={set('confirmar_password')}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+57 300 000 0000"
                value={form.telefono}
                onChange={set('telefono')}
                autoComplete="tel"
              />
            </div>
            <div className="form-group">
              <label className="form-label">N° de documento *</label>
              <input
                type="text"
                className="form-input"
                placeholder="CC / Pasaporte / TI"
                value={form.num_documento}
                onChange={set('num_documento')}
                required
              />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-gold btn-full"
            disabled={loading}
          >
            {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="login-back" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--c-gold)' }}>Inicia sesión</Link>
        </p>
        <p className="login-back">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
