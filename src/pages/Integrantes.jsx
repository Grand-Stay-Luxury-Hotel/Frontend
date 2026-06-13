import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { IconCheck, IconShield, IconUsers } from '../components/icons/index.jsx';

const GROUP_LABELS = {
  backend: 'Backend',
  frontend: 'Frontend',
};

const INITIAL_REGISTRO = {
  seudonimo: '',
  nombreCompleto: '',
  grupo: 'frontend',
  codigoRegistro: '',
};

const INITIAL_INGRESO = {
  identidad: '',
  identificador: '',
};

export default function Integrantes() {
  const { addToast } = useToast();
  const [registro, setRegistro] = useState(INITIAL_REGISTRO);
  const [ingreso, setIngreso] = useState(INITIAL_INGRESO);
  const [registrando, setRegistrando] = useState(false);
  const [validando, setValidando] = useState(false);
  const [resultadoRegistro, setResultadoRegistro] = useState(null);
  const [resultadoIngreso, setResultadoIngreso] = useState(null);
  const [error, setError] = useState('');

  const handleCodigoIngreso = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 3);
    setIngreso((prev) => ({ ...prev, identificador: value }));
    setResultadoIngreso(null);
  };

  const registrar = async (event) => {
    event.preventDefault();
    setError('');
    setResultadoRegistro(null);

    if (!registro.seudonimo.trim() || !registro.nombreCompleto.trim() || !registro.grupo || !registro.codigoRegistro.trim()) {
      setError('Complete los datos de registro y el codigo entregado por el administrador.');
      return;
    }

    setRegistrando(true);
    try {
      const res = await api.integrantes.registrar({
        seudonimo: registro.seudonimo.trim(),
        nombreCompleto: registro.nombreCompleto.trim(),
        grupo: registro.grupo,
        codigoRegistro: registro.codigoRegistro.trim().toUpperCase(),
      });
      setResultadoRegistro(res);
      setRegistro(INITIAL_REGISTRO);
      addToast(res.mensaje, 'success');
    } catch (err) {
      const msg = err.message || 'No se pudo registrar el integrante.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setRegistrando(false);
    }
  };

  const validar = async (event) => {
    event.preventDefault();
    setError('');
    setResultadoIngreso(null);

    if (!ingreso.identidad.trim() || !ingreso.identificador) {
      setError('Ingrese sus datos de acceso junto con el codigo.');
      return;
    }

    setValidando(true);
    try {
      const res = await api.integrantes.validar({
        integrante: ingreso.identidad.trim(),
        identificador: ingreso.identificador,
      });
      setResultadoIngreso(res);
      addToast(res.mensaje, res.valido ? 'success' : 'warning');
    } catch (err) {
      const msg = err.message || 'No se pudo validar el integrante.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setValidando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      <nav className="landing-nav scrolled">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">Grand <span>Stay</span></Link>
          <div className="nav-actions">
            <Link to="/" className="nav-link">Inicio</Link>
            <Link to="/login" className="btn btn-outline btn-sm">Ingresar</Link>
          </div>
        </div>
      </nav>

      <main className="section" style={{ paddingTop: '7rem' }}>
        <div className="container">
          <div className="page-header">
            <p className="eyebrow">Equipo de desarrollo</p>
            <h1>Registro de Integrantes</h1>
            <p>Registre su acceso con el codigo entregado por administracion o valide su ingreso si ya esta activo.</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="grid-2" style={{ alignItems: 'start' }}>
            <section className="card">
              <PanelHeader icon={<IconUsers />} title="Nuevo integrante" text="El codigo de registro lo entrega un administrador." />
              <form onSubmit={registrar} className="login-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Seudonimo</label>
                    <input
                      className="form-input"
                      value={registro.seudonimo}
                      onChange={(event) => {
                        setRegistro((prev) => ({ ...prev, seudonimo: event.target.value }));
                        setResultadoRegistro(null);
                      }}
                      placeholder="Su identificador interno"
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grupo</label>
                    <select
                      className="form-select"
                      value={registro.grupo}
                      onChange={(event) => setRegistro((prev) => ({ ...prev, grupo: event.target.value }))}
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input
                    className="form-input"
                    value={registro.nombreCompleto}
                    onChange={(event) => {
                      setRegistro((prev) => ({ ...prev, nombreCompleto: event.target.value }));
                      setResultadoRegistro(null);
                    }}
                    placeholder="Nombre Apellido"
                    autoComplete="name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Codigo de registro</label>
                  <input
                    className="form-input"
                    value={registro.codigoRegistro}
                    onChange={(event) => {
                      setRegistro((prev) => ({ ...prev, codigoRegistro: event.target.value.toUpperCase() }));
                      setResultadoRegistro(null);
                    }}
                    placeholder="Codigo entregado"
                    autoComplete="off"
                  />
                </div>

                {resultadoRegistro && (
                  <div className="alert alert-success">
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      <span style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                        <IconCheck />
                        {resultadoRegistro.mensaje}
                      </span>
                      {resultadoRegistro.codigoIngreso && (
                        <span>
                          Codigo de ingreso: <strong style={{ color: 'var(--c-gold)', fontSize: '1.25rem' }}>{resultadoRegistro.codigoIngreso}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-gold btn-full" disabled={registrando}>
                  {registrando ? 'Registrando...' : 'Registrar integrante'}
                </button>
              </form>
            </section>

            <section className="card">
              <PanelHeader icon={<IconShield />} title="Ingreso de integrante" text="El sistema identificara el tipo de dato ingresado." />
              <form onSubmit={validar} className="login-form">
                <div className="form-group">
                  <label className="form-label">Identidad</label>
                  <input
                    className="form-input"
                    value={ingreso.identidad}
                    onChange={(event) => {
                      setIngreso((prev) => ({ ...prev, identidad: event.target.value }));
                      setResultadoIngreso(null);
                    }}
                    placeholder="Ingrese su dato de acceso"
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Codigo unico</label>
                  <input
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={3}
                    pattern="[0-9]{3}"
                    placeholder="000"
                    value={ingreso.identificador}
                    onChange={handleCodigoIngreso}
                  />
                </div>

                {resultadoIngreso && (
                  <div className={`alert ${resultadoIngreso.valido ? 'alert-success' : 'alert-warning'}`}>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <span style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                        {resultadoIngreso.valido && <IconCheck />}
                        {resultadoIngreso.mensaje}
                      </span>
                      {resultadoIngreso.integrante && (
                        <span>
                          {resultadoIngreso.integrante.nombreCompleto} - {resultadoIngreso.integrante.seudonimo} - {GROUP_LABELS[resultadoIngreso.integrante.grupo]}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-outline btn-full" disabled={validando}>
                  {validando ? 'Validando...' : 'Validar ingreso'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function PanelHeader({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <span className="exp-icon" style={{ margin: 0 }}>{icon}</span>
      <div>
        <h2 style={{ fontSize: '1.05rem', color: 'var(--c-text)' }}>{title}</h2>
        <p style={{ color: 'var(--c-text-2)', fontSize: '0.82rem' }}>{text}</p>
      </div>
    </div>
  );
}
