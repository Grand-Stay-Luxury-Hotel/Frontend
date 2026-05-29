const BASE = '/api';

const SERVICIOS_COMPAT = [
  { id_servicio: 1, nombre: 'Masaje relajante 60 min', categoria: 'spa', precio: 120000 },
  { id_servicio: 2, nombre: 'Desayuno buffet', categoria: 'restaurante', precio: 45000 },
  { id_servicio: 4, nombre: 'Lavanderia express', categoria: 'lavanderia', precio: 35000 },
];

const TIPOS_HAB_COMPAT = [
  { id_tipo: 1, nombre: 'Estandar' },
  { id_tipo: 2, nombre: 'Deluxe' },
  { id_tipo: 3, nombre: 'Suite Junior' },
  { id_tipo: 4, nombre: 'Suite Senior' },
  { id_tipo: 5, nombre: 'Presidencial' },
];

const INSUMOS_COMPAT = [
  { id_insumo: 1, nombre: 'Desinfectante multiusos', categoria: 'quimico', unidad_medida: 'litro', stock_actual: 0, stock_minimo: 10 },
  { id_insumo: 2, nombre: 'Detergente ropa blanca', categoria: 'quimico', unidad_medida: 'kg', stock_actual: 0, stock_minimo: 5 },
  { id_insumo: 3, nombre: 'Trapo de microfibra', categoria: 'textil', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 20 },
  { id_insumo: 4, nombre: 'Papel higienico rollo', categoria: 'papel', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 50 },
  { id_insumo: 5, nombre: 'Escoba plastica', categoria: 'herramienta', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 4 },
  { id_insumo: 6, nombre: 'Limpiavidrios spray', categoria: 'quimico', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 5 },
];

function unsupportedEndpoint(msg) {
  const err = new Error(msg);
  err.status = 501;
  throw err;
}

function normalizeData(res) {
  if (Array.isArray(res)) return res;
  return res?.data ?? [];
}

async function getReservaByIdOrSearch(value, token) {
  const search = encodeURIComponent(String(value ?? '').trim());
  const res = await request('GET', `/reservas?buscar=${search}&limite=20`, null, token);
  const list = normalizeData(res);
  return list.find((r) => String(r.id_reserva) === String(value)) ?? list[0] ?? null;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(date);
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function keyMonth(date) {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
}

async function request(method, path, body = null, token = null) {
  const headers = {};
  if (body !== null) headers['Content-Type'] = 'application/json';
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
  // ── Autenticación ─────────────────────────────────────────────────────────
  auth: {
    login:       (body)        => request('POST', '/auth/login',    body),
    registro:    (body)        => request('POST', '/auth/registro', body),
    verificarOTP:(_body)       => unsupportedEndpoint('La version actual del backend valida OTP dentro de /auth/login.'),
  },

  // ── Tipos de habitación (público) ──────────────────────────────────────────
  habitacionesTipos: {
    listar: async (token = null) => {
      if (!token) return TIPOS_HAB_COMPAT;
      try {
        const stored = sessionStorage.getItem('gs_auth');
        const auth = stored ? JSON.parse(stored) : null;
        if (auth?.rol === 'Huesped' || auth?.rol === 'Huésped') {
          return TIPOS_HAB_COMPAT;
        }
        const res = await request('GET', '/habitaciones?limite=100', null, token);
        const items = normalizeData(res);
        const unique = new Map();
        for (const it of items) {
          if (it?.id_tipo && it?.tipo_nombre) unique.set(it.id_tipo, { id_tipo: it.id_tipo, nombre: it.tipo_nombre });
        }
        return unique.size ? Array.from(unique.values()) : TIPOS_HAB_COMPAT;
      } catch {
        return TIPOS_HAB_COMPAT;
      }
    },
  },

  // ── Disponibilidad ─────────────────────────────────────────────────────────
  disponibilidad: {
    consultar: (params, token) =>
      request('GET', `/habitaciones/disponibilidad?${new URLSearchParams(params)}`, null, token),
  },

  // ── Habitaciones (gestión) ─────────────────────────────────────────────────
  habitaciones: {
    listar:         async (token) => {
      try {
        return await request('GET', '/habitaciones?limite=100', null, token);
      } catch {
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const data = await request(
          'GET',
          `/habitaciones/disponibilidad?${new URLSearchParams({ fechaEntrada: today, fechaSalida: tomorrow })}`,
          null,
          token,
        );
        const items = normalizeData(data);
        return {
          data: items.map((h) => ({
            id_habitacion: h.id_habitacion,
            numero_habitacion: h.numero_habitacion ?? h.numero,
            numero: h.numero ?? h.numero_habitacion,
            tipo_nombre: h.tipo_nombre,
            piso: h.piso,
            estado: h.estado ?? 'disponible',
          })),
        };
      }
    },
    estadoPorNumero: async (numero, estado, token) => {
      const res = await request('GET', '/habitaciones?limite=100', null, token);
      const habitaciones = normalizeData(res);
      const hab = habitaciones.find((h) => String(h.numero_habitacion ?? h.numero) === String(numero));
      if (!hab?.id_habitacion) {
        throw new Error(`No se encontró la habitación ${numero}`);
      }
      return request('PATCH', `/habitaciones/${hab.id_habitacion}/estado`, { estado }, token);
    },
    estado:         (id, body, token)      => request('PATCH', `/habitaciones/${id}/estado`, body, token),
  },

  // ── Tarifas ────────────────────────────────────────────────────────────────
  tarifas: {
    listar:     (_token)        => unsupportedEndpoint('El backend actual no expone endpoints /tarifas.'),
    crear:      (_body, _token) => unsupportedEndpoint('El backend actual no expone endpoints /tarifas.'),
    actualizar: (_id, _body, _token) => unsupportedEndpoint('El backend actual no expone endpoints /tarifas.'),
    eliminar:   (_id, _token)   => unsupportedEndpoint('El backend actual no expone endpoints /tarifas.'),
  },

  // ── Reservas ───────────────────────────────────────────────────────────────
  reservas: {
    listar:              (token)        => request('GET',    '/reservas', null, token),
    crear:               (body, token)  => request('POST',   '/reservas', body, token),
    cancelar:            (id, token)    => request('DELETE', `/reservas/${id}`, null, token),
    buscarPorDocumento: async (doc, token) => {
      const res = await request('GET', `/reservas?buscar=${encodeURIComponent(doc)}&limite=20`, null, token);
      const list = normalizeData(res);
      const item = list.find((r) => String(r.huesped_documento ?? '').includes(String(doc))) ?? list[0];
      if (!item) throw new Error('Huésped no encontrado');
      return {
        id_huesped: item.id_huesped,
        nombre_completo: item.huesped_nombre,
        email: item.huesped_email,
        documento: item.huesped_documento,
      };
    },
  },

  // ── Check-in ───────────────────────────────────────────────────────────────
  checkin: {
    registrar:        async (reservaId, body, token) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token);
      if (!reserva?.id_reserva) {
        throw new Error('No se encontró la reserva para registrar check-in.');
      }
      return request('POST', `/checkin/${reserva.id_reserva}`, body, token);
    },
    registrarPorCodigo: async (codigo, token) => {
      const reserva = await getReservaByIdOrSearch(codigo, token);
      if (!reserva?.id_reserva) {
        throw new Error('No se encontró la reserva asociada al código de confirmación.');
      }
      return request('POST', `/checkin/${reserva.id_reserva}`, { documento_verificado: true }, token);
    },
  },

  // ── Check-out ──────────────────────────────────────────────────────────────
  checkout: {
    previo: async (reservaId, token) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token);
      if (!reserva) throw new Error('No se encontró la reserva para generar resumen previo.');
      return {
        id_reserva: reserva.id_reserva,
        estado: reserva.estado,
        fecha_entrada: reserva.fecha_entrada,
        fecha_salida: reserva.fecha_salida,
        total_facturado: null,
        saldo_pendiente: null,
        consumos: [],
      };
    },
    registrar: async (reservaId, token) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token);
      if (!reserva?.id_reserva) {
        throw new Error('No se encontró la reserva para registrar check-out.');
      }
      return request('POST', `/checkout/${reserva.id_reserva}`, {}, token);
    },
  },

  // ── Facturas ───────────────────────────────────────────────────────────────
  facturas: {
    obtener: (_idReserva, _token) => unsupportedEndpoint('El backend actual no expone endpoint de consulta de facturas por API.'),
  },

  // ── Consumos ───────────────────────────────────────────────────────────────
  consumos: {
    porReserva: async (reservaId, token) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token);
      if (!reserva?.id_reserva) return { data: [] };
      return request('GET', `/consumos/${reserva.id_reserva}`, null, token);
    },
    registrar:  async (body, token) => {
      if (body?.habitacionId) {
        return request('POST', '/consumos', body, token);
      }

      const reserva = await getReservaByIdOrSearch(body?.id_reserva, token);
      if (!reserva?.id_habitacion) {
        throw new Error('No se pudo asociar la reserva a una habitación activa para registrar consumo.');
      }

      const servicio = SERVICIOS_COMPAT.find((s) => String(s.id_servicio) === String(body?.id_servicio)) ?? SERVICIOS_COMPAT[0];
      const payload = {
        habitacionId: Number(reserva.id_habitacion),
        tipo: servicio.categoria,
        descripcion: body?.descripcion || servicio.nombre,
        cantidad: Number(body?.cantidad || 1),
        precio_unitario: Number(body?.precio_unitario ?? servicio.precio),
      };

      return request('POST', '/consumos', payload, token);
    },
  },

  // ── Servicios adicionales (público) ────────────────────────────────────────
  servicios: {
    listar: async () => SERVICIOS_COMPAT,
  },

  // ── Inventario ─────────────────────────────────────────────────────────────
  inventario: {
    listarInsumos:    async (_token) => INSUMOS_COMPAT,
    stockCritico:     async (token) => {
      const res = await request('GET', '/inventario/alertas', null, token);
      const data = normalizeData(res);
      return data.map((a) => ({
        id_insumo: Number(a.id_insumo),
        nombre: a.nombre,
        stock_actual: Number(a.stock_actual),
        stock_minimo: Number(a.stock_minimo),
        criticidad: a.criticidad,
      }));
    },
    historial:        async (_params, _token) => ({ data: [] }),
    alertas:          async (token) => {
      try {
        return await request('GET', '/inventario/alertas', null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
    registrarConsumo: (body, token)            => request('POST',  '/inventario/consumo',       body,       token),
    umbral:           (id, umbral, token)      => request('PATCH', `/inventario/${id}/umbral`,  { umbral }, token),
  },

  // ── Reportes ───────────────────────────────────────────────────────────────
  reportes: {
    ocupacion: (params, token) =>
      request('GET', `/reportes/ocupacion?${new URLSearchParams(params)}`, null, token),
    ingresos: (params, token) =>
      request('GET', `/reportes/ingresos?${new URLSearchParams(params)}`, null, token),
  },

  // ── Cuenta huésped ─────────────────────────────────────────────────────────
  cuenta: {
    obtener: async (token) => {
      const [reservasRes, consumosRes] = await Promise.allSettled([
        request('GET', '/reservas/mis-reservas', null, token),
        request('GET', '/consumos/mis-consumos', null, token),
      ]);

      const reservas = reservasRes.status === 'fulfilled' ? normalizeData(reservasRes.value) : [];
      const consumos = consumosRes.status === 'fulfilled' ? normalizeData(consumosRes.value) : [];

      const totalNoches = reservas.reduce((acc, r) => {
        if (!r.fecha_entrada || !r.fecha_salida) return acc;
        const diff = (new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / (1000 * 60 * 60 * 24);
        return acc + (diff > 0 ? diff : 0);
      }, 0);

      const totalGastado = reservas.reduce((acc, r) => acc + Number(r.monto_pagado ?? 0), 0)
        + consumos.reduce((acc, c) => acc + Number(c.subtotal ?? 0), 0);

      // Facturas derivadas de reservas completadas/en_curso
      const facturas = reservas
        .filter((r) => ['completada', 'en_curso'].includes(r.estado))
        .map((r) => ({
          id_reserva: r.id_reserva,
          codigo_factura: r.codigo_confirmacion ?? `RES-${r.id_reserva}`,
          fecha_emision: r.fecha_salida,
          total_facturado: Number(r.monto_pagado ?? 0)
            + consumos
                .filter((c) => c.id_reserva === r.id_reserva)
                .reduce((a, c) => a + Number(c.subtotal ?? 0), 0),
          saldo_pendiente: 0,
        }));

      return {
        huesped: reservas[0]
          ? { nombre_completo: reservas[0].huesped_nombre, email: reservas[0].huesped_email }
          : null,
        reservas,
        consumos,
        facturas,
        resumen: {
          total_reservas: reservas.length,
          total_noches: totalNoches,
          total_gastado: totalGastado,
          total_consumos: consumos.length,
          reservas_activas: reservas.filter((r) => ['confirmada', 'en_curso', 'pendiente'].includes(r.estado)).length,
        },
      };
    },
  },

  // ── Dashboard Admin ────────────────────────────────────────────────────────
  dashboard: {
    resumen: async (token) => {
      const [habRes, reservasRes] = await Promise.allSettled([
        request('GET', '/habitaciones?limite=100', null, token),
        request('GET', '/reservas?limite=100', null, token),
      ]);

      const habitaciones = habRes.status === 'fulfilled' ? normalizeData(habRes.value) : [];
      const reservas = reservasRes.status === 'fulfilled' ? normalizeData(reservasRes.value) : [];
      const totalHab = habitaciones.length;
      const estados = habitaciones.reduce((acc, h) => {
        const st = String(h.estado ?? '').toLowerCase();
        acc[st] = (acc[st] ?? 0) + 1;
        return acc;
      }, {});

      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const currentMonthStart = startOfMonth(today);
      const currentMonthEnd = addMonths(currentMonthStart, 1);

      const reservasMesList = reservas.filter((r) => {
        const d = new Date(`${r.fecha_entrada}T00:00:00Z`);
        return d >= currentMonthStart && d < currentMonthEnd;
      });

      const checkinsPendientes = reservas.filter((r) => r.estado === 'confirmada').length;
      const checkoutsPendientes = reservas.filter((r) => r.estado === 'en_curso').length;

      const meses = [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = addMonths(currentMonthStart, -i);
        meses.push({ key: keyMonth(d), mes: monthLabel(d), reservas: 0, ingresos: 0 });
      }
      const mesMap = new Map(meses.map((m) => [m.key, m]));
      reservas.forEach((r) => {
        const d = new Date(`${r.fecha_entrada}T00:00:00Z`);
        const key = keyMonth(d);
        const slot = mesMap.get(key);
        if (!slot) return;
        slot.reservas += 1;
        slot.ingresos += Number(r.monto_pagado ?? 0);
      });

      const porTipoMap = new Map();
      reservas.forEach((r) => {
        const k = r.tipo_habitacion ?? 'Sin tipo';
        porTipoMap.set(k, (porTipoMap.get(k) ?? 0) + 1);
      });

      const porCanalMap = new Map();
      reservas.forEach((r) => {
        const k = r.canal_reserva ?? 'sin_canal';
        porCanalMap.set(k, (porCanalMap.get(k) ?? 0) + 1);
      });

      let alertasInventario = 0;
      try {
        const alertasRes = await request('GET', '/inventario/alertas?limite=1', null, token);
        alertasInventario = Number(alertasRes.total ?? normalizeData(alertasRes).length ?? 0);
      } catch {
        alertasInventario = 0;
      }

      return {
        habitaciones: {
          total: totalHab,
          disponible: estados.disponible ?? 0,
          ocupada: estados.ocupada ?? 0,
          limpieza: estados.limpieza ?? 0,
          mantenimiento: estados.mantenimiento ?? 0,
          bloqueada: estados.bloqueada ?? 0,
        },
        checkinsPendientes,
        checkoutsPendientes,
        reservasMes: {
          total: reservasMesList.length,
          ingresos: reservasMesList.reduce((acc, r) => acc + Number(r.monto_pagado ?? 0), 0),
        },
        alertasInventario,
        ingresosMensuales: meses,
        reservasPorTipo: Array.from(porTipoMap.entries()).map(([tipo, total]) => ({ tipo, total })),
        reservasPorCanal: Array.from(porCanalMap.entries()).map(([canal, total]) => ({ canal, total })),
      };
    },
  },

  // ── Auditoría (Administrador) ──────────────────────────────────────────────
  auditoria: {
    listar: async (_params, _token) => ({ data: [], total: 0 }),
  },
};
