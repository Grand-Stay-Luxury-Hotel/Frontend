import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';

/**
 * Login — página completa (la versión modal es LoginModal.jsx).
 * Usa el mismo LoginForm reutilizable.
 */
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  // Conserva todos los params menos 'redirect', para reusarlos después del login
  const handleSuccess = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('redirect');
    const qs = params.toString();
    navigate(qs ? `${redirect}?${qs}` : redirect, { replace: true });
  };

  return (
    <div className="login-page">
      {/* LEFT — image */}
      <div className="login-image">
        <p className="login-image-quote">
          "El lujo no es una necesidad para mí,<br />
          sino una forma de trascender."
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
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
