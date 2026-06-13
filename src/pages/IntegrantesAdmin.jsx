import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { IconCheck, IconShield, IconUsers } from '../components/icons/index.jsx';

const GROUP_LABELS = {
  backend: 'Backend',
  frontend: 'Frontend',
};

const INITIAL_VALIDACION = {
  modo: 'seudonimo',
  seudonimo: '',
  nombreCompleto: '',
  identificador: '',
};

export default function IntegrantesAdmin() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [integrantes, setIntegrantes] = useState([]);
  const [codigosRegistro, setCodigosRegistro] = useState([]);
  const [validacion, setValidacion] = useState(INITIAL_VALIDACION);
  const [codigoAlias, setCodigoAlias] = useState('');
  const [codigoActual, setCodigoActual] = useState(null);
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCodigos, setLoadingCodigos] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const integrantesPorGrupo = useMemo(() => ({
    backend: integrantes.filter((item) => item.grupo === 'backend'),
    frontend: integrantes.filter((item) => item.grupo === 'frontend'),
  }), [integrantes]);

  const cargarIntegrantes = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await api.integrantes.listar();
      const items = res.data ?? [];
      setIntegrantes(items);
      setCodigoAlias((current) => current || items[0]?.id || '');
      setValidacion((current) => ({ ...current, seudonimo: current.seudonimo || items[0]?.id || '' }));
    } catch (err) {
      const msg = err.message || 'No se pudieron cargar los integrantes.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoadingList(false);
    }
  }, [addToast]);

  const cargarCodigos = useCallback(async () => {
    if (!auth?.token) return;
    setLoadingCodigos(true);
    try {
      const res = await api.integrantes.codigos(auth.token);
      setCodigosRegistro(res.data ?? []);
    } catch (err) {
      const msg = err.message || 'No se pudieron cargar los codigos de registro.';
      addToast(msg, 'error');
    } finally {
      setLoadingCodigos(false);
    }
  }, [addToast, auth?.token]);

  useEffect(() => {
    cargarIntegrantes();
  }, [cargarIntegrantes]);

  useEffect(() => {
    cargarCodigos();
  }, [cargarCodigos]);

  const handleCodigoInput = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 3);
    setValidacion((prev) => ({ ...prev, identificador: value }));
    setResultado(null);
  };

  const generarCodigo = async () => {
    setError('');
    setCodigoGenerado(null);
    setGeneratingCode(true);
    try {
      const res = await api.integrantes.generarCodigo(auth.token);
      setCodigoGenerado(res);
      await cargarCodigos();
      addToast(res.mensaje, 'success');
    } catch (err) {
      const msg = err.message || 'No se pudo generar el codigo de registro.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setGeneratingCode(false);
    }
  };

  const consultarCodigo = async () => {
    setError('');
    setCodigoActual(null);
    if (!codigoAlias) {
      setError('Seleccione un seudonimo para consultar el codigo.');
      return;
    }

    setLoadingCode(true);
    try {
      const res = await api.integrantes.codigo(codigoAlias);
      setCodigoActual(res);
      setValidacion((prev) => ({
        ...prev,
        modo: 'seudonimo',
        seudonimo: res.seudonimo,
        identificador: res.identificador,
      }));
    } catch (err) {
      const msg = err.message || 'No se pudo consultar el codigo vigente.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoadingCode(false);
    }
  };

  const validar = async (event) => {
    event.preventDefault();
    setError('');
    setResultado(null);

    const usaSeudonimo = validacion.modo === 'seudonimo';
    const identidad = usaSeudonimo ? validacion.seudonimo : validacion.nombreCompleto;
    if (!identidad?.trim() || !validacion.identificador) {
      setError('Ingrese seudonimo o nombre real junto con el codigo.');
      return;
    }

    setValidating(true);
    try {
      const payload = usaSeudonimo
        ? { seudonimo: validacion.seudonimo, identificador: validacion.identificador }
        : { nombreCompleto: validacion.nombreCompleto, identificador: validacion.identificador };
      const res = await api.integrantes.validar(payload);
      setResultado(res);
      addToast(res.mensaje, res.valido ? 'success' : 'warning');
    } catch (err) {
      const msg = err.message || 'No se pudo validar el integrante.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Equipo de desarrollo</p>
        <h1>Gestion de Integrantes</h1>
        <p>Genere codigos de registro para nuevos integrantes y consulte el estado del equipo.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '1.5rem' }}>
        <section className="card">
          <PanelHeader icon={<IconUsers />} title="Integrantes registrados" text="Listado agrupado por equipo." />

          {loadingList ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(integrantesPorGrupo).map(([grupo, items]) => (
                <div key={grupo} className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{GROUP_LABELS[grupo]}</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan={2}>Sin integrantes registrados</td></tr>
                      ) : items.map((item) => (
                        <tr key={item.id}>
                          <td style={{ color: 'var(--c-text)' }}>{item.seudonimo}</td>
                          <td><span className="badge badge-success">Registrado</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <PanelHeader icon={<IconShield />} title="Codigo de registro" text="Cree una invitacion de un solo uso para la pagina publica." />
          <div className="login-form">
            <button type="button" className="btn btn-gold btn-full" onClick={generarCodigo} disabled={generatingCode}>
              {generatingCode ? 'Generando...' : 'Generar codigo para integrante'}
            </button>

            {codigoGenerado && (
              <div className="alert alert-success">
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Codigo generado</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--c-gold)' }}>{codigoGenerado.codigoRegistro}</strong>
                  <span>Vigente hasta {new Date(codigoGenerado.expira_en).toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invitaciones activas</th>
                    <th>Expira</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCodigos ? (
                    <tr><td colSpan={2}>Cargando...</td></tr>
                  ) : codigosRegistro.length === 0 ? (
                    <tr><td colSpan={2}>Sin codigos activos</td></tr>
                  ) : codigosRegistro.map((item) => (
                    <tr key={item.id}>
                      <td><span className="badge badge-success">Disponible</span></td>
                      <td>{new Date(item.expira_en).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <PanelHeader icon={<IconShield />} title="Codigo vigente" text="Consulta de apoyo para ambiente de desarrollo." />
          <div className="login-form">
            <div className="form-group">
              <label className="form-label">Seudonimo</label>
              <select
                className="form-select"
                value={codigoAlias}
                onChange={(event) => {
                  setCodigoAlias(event.target.value);
                  setCodigoActual(null);
                }}
                disabled={loadingList}
              >
                <option value="">Seleccione integrante</option>
                {integrantes.map((item) => (
                  <option key={item.id} value={item.id}>{item.seudonimo}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-outline btn-full" onClick={consultarCodigo} disabled={loadingCode || loadingList}>
              {loadingCode ? 'Consultando...' : 'Ver codigo vigente'}
            </button>

            {codigoActual && (
              <div className="alert alert-info">
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--c-gold)' }}>{codigoActual.identificador}</strong>
                  <span>{codigoActual.seudonimo} - {GROUP_LABELS[codigoActual.grupo]}</span>
                  <span>Expira en {codigoActual.expira_en_segundos} segundos</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <PanelHeader icon={<IconShield />} title="Ingreso por codigo" text="Valide por seudonimo o por nombre real." />
          <form onSubmit={validar} className="login-form">
            <div className="form-group">
              <label className="form-label">Tipo de ingreso</label>
              <select
                className="form-select"
                value={validacion.modo}
                onChange={(event) => {
                  setValidacion((prev) => ({ ...prev, modo: event.target.value }));
                  setResultado(null);
                }}
              >
                <option value="seudonimo">Seudonimo</option>
                <option value="nombreCompleto">Nombre real</option>
              </select>
            </div>

            {validacion.modo === 'seudonimo' ? (
              <div className="form-group">
                <label className="form-label">Seudonimo</label>
                <select
                  className="form-select"
                  value={validacion.seudonimo}
                  onChange={(event) => {
                    setValidacion((prev) => ({ ...prev, seudonimo: event.target.value }));
                    setResultado(null);
                  }}
                  disabled={loadingList}
                >
                  <option value="">Seleccione integrante</option>
                  {integrantes.map((item) => (
                    <option key={item.id} value={item.seudonimo}>{item.seudonimo}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Nombre real completo</label>
                <input
                  className="form-input"
                  value={validacion.nombreCompleto}
                  onChange={(event) => {
                    setValidacion((prev) => ({ ...prev, nombreCompleto: event.target.value }));
                    setResultado(null);
                  }}
                  placeholder="Nombre Apellido"
                  autoComplete="off"
                />
              </div>
            )}

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
                value={validacion.identificador}
                onChange={handleCodigoInput}
              />
            </div>

            {resultado && (
              <div className={`alert ${resultado.valido ? 'alert-success' : 'alert-warning'}`}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <span style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    {resultado.valido && <IconCheck />}
                    {resultado.mensaje}
                  </span>
                  {resultado.integrante && (
                    <span>
                      {resultado.integrante.nombreCompleto} - {resultado.integrante.seudonimo} - {GROUP_LABELS[resultado.integrante.grupo]}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-outline btn-full" disabled={validating || loadingList}>
              {validating ? 'Validando...' : 'Validar ingreso'}
            </button>
          </form>
        </section>
      </div>
    </>
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
