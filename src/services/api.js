const BASE = '/api';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const err = new Error(data.mensaje || data.message || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  auth: {
    login:    (body) => request('POST', '/auth/login',    body),
    registro: (body) => request('POST', '/auth/registro', body),
  },
  disponibilidad: {
    consultar: (params, token) =>
      request('GET', `/habitaciones/disponibilidad?${new URLSearchParams(params)}`, null, token),
  },
  reservas: {
    listar:  (token)        => request('GET',    '/reservas',       null, token),
    buscarHuesped: (documento, token) =>
      request('GET', `/reservas/huespedes/buscar?${new URLSearchParams({ documento })}`, null, token),
    crear:   (body, token)  => request('POST',   '/reservas',      body, token),
    cancelar: (id, token)   => request('DELETE',  `/reservas/${id}`, null, token),
  },
  checkin: {
    registrar: (reservaId, body, token) =>
      request('POST', `/checkin/${reservaId}`, body, token),
  },
  checkout: {
    registrar: (reservaId, token) =>
      request('POST', `/checkout/${reservaId}`, {}, token),
  },
  consumos: {
    registrar: (body, token) => request('POST', '/consumos', body, token),
  },
  inventario: {
    alertas: (token)               => request('GET',   '/inventario/alertas',          null,      token),
    consumo: (body, token)         => request('POST',  '/inventario/consumo',           body,      token),
    umbral:  (id, umbral, token)   => request('PATCH', `/inventario/${id}/umbral`,      { umbral }, token),
  },
  habitaciones: {
    listar: (token) => request('GET', '/habitaciones', null, token),
    estado: (id, body, token) => request('PATCH', `/habitaciones/${id}/estado`, body, token),
  },
  reportes: {
    ocupacion: (params, token) =>
      request('GET', `/reportes/ocupacion?${new URLSearchParams(params)}`, null, token),
    ingresos: (params, token) =>
      request('GET', `/reportes/ingresos?${new URLSearchParams(params)}`, null, token),
  },
  tarifas: {
    listar: (token) => request('GET', '/tarifas', null, token),
    crear: (body, token) => request('POST', '/tarifas', body, token),
    actualizar: (id, body, token) => request('PATCH', `/tarifas/${id}`, body, token),
    eliminar: (id, token) => request('DELETE', `/tarifas/${id}`, null, token),
  },
  cuenta: {
    consultar: (params, token) =>
      request('GET', `/huespedes/cuenta?${new URLSearchParams(params)}`, null, token),
  },
};
