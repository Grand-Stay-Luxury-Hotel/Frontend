import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm.jsx';
import { ROUTES } from '../utils/routes.js';

/**
 * Registro — página completa (la versión modal vive en LoginModal).
 * Usa el mismo RegisterForm reutilizable.
 */
export default function Registro() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(ROUTES.DASHBOARD_DISPONIBILIDAD, { replace: true });
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
        <RegisterForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
