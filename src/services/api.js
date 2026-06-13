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

async function getReservaByIdOrSearch(value, token, options = {}) {
  try {
    const search = String(value ?? '').trim();
    const params = new URLSearchParams({ buscar: search, limite: String(options.limite ?? 20) });
    if (options.operacion) params.set('operacion', options.operacion);
    if (options.estado) params.set('estado', options.estado);
    const res = await request('GET', `/reservas?${params}`, null, token);
    const list = normalizeData(res);
    return list.find((r) => String(r.id_reserva) === String(value)) ?? list[0] ?? null;
  } catch {
    return null;
  }
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
  if (body !== null && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el backend. Verifique que el servidor este activo.');
  }

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const err = new Error('La API no devolvio JSON valido. Revise el proxy /api entre frontend y backend.');
    err.status = res.status;
    err.raw = text;
    throw err;
  }

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

  integrantes: {
    listar:         ()            => request('GET',  '/integrantes'),
    registrar:      (body)        => request('POST', '/integrantes', body),
    codigos:        (token)       => request('GET',  '/integrantes/codigos', null, token),
    generarCodigo:  (token)       => request('POST', '/integrantes/codigos', {}, token),
    codigo:         (id)          => request('GET',  `/integrantes/${encodeURIComponent(id)}/codigo`),
    validar:        (body)        => request('POST', '/integrantes/validar', body),
  },

  // ── Tipos de habitación (público) ──────────────────────────────────────────
  habitacionesTipos: {
    listar: async (token = null) => {
      if (!token) return TIPOS_HAB_COMPAT;
      try {
        const res = await request('GET', '/habitaciones?limite=50', null, token);
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
        return await request('GET', '/habitaciones?limite=50', null, token);
      } catch {
        try {
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
        } catch {
          return { data: [], total: 0 };
        }
      }
    },
    estadoPorNumero: async (numero, estado, token, observaciones = '') => {
      try {
        const res = await request('GET', '/habitaciones?limite=50', null, token);
        const habitaciones = normalizeData(res);
        const hab = habitaciones.find((h) => String(h.numero_habitacion ?? h.numero) === String(numero));
        if (!hab?.id_habitacion) {
          throw new Error(`No se encontró la habitación ${numero}`);
        }
        return request('PATCH', `/habitaciones/${hab.id_habitacion}/estado`, { estado, observaciones }, token);
      } catch (err) {
        throw err;
      }
    },
    estado:         (id, body, token)      => request('PATCH', `/habitaciones/${id}/estado`, body, token),
  },

  // ── Tarifas ────────────────────────────────────────────────────────────────
  tarifas: {
    listar: async (token) => {
      try {
        return await request('GET', '/tarifas', null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
    crear:      (body, token)        => request('POST',   '/tarifas',      body,  token),
    actualizar: (id, body, token)    => request('PUT',    `/tarifas/${id}`, body, token),
    eliminar:   (id, token)          => request('DELETE', `/tarifas/${id}`, null, token),
  },

  // ── Reservas ───────────────────────────────────────────────────────────────
  reservas: {
    listar: async (token) => {
      try {
        return await request('GET', '/reservas?limite=50', null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
    listarParaCheckin: async (token) => {
      try {
        return await request('GET', '/reservas?operacion=checkin&limite=50', null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
    listarParaCheckout: async (token) => {
      try {
        return await request('GET', '/reservas?operacion=checkout&limite=50', null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
    crear:               (body, token)  => request('POST',   '/reservas', body, token),
    cancelar:            (id, token)    => request('DELETE', `/reservas/${id}`, null, token),
    buscarPorDocumento: async (doc, token) => {
      try {
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
      } catch (err) {
        throw err;
      }
    },
  },

  // ── Check-in ───────────────────────────────────────────────────────────────
  checkin: {
    registrar:        async (reservaId, body, token) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token, { operacion: 'checkin' });
      if (!reserva?.id_reserva) {
        const encontrada = await getReservaByIdOrSearch(reservaId, token);
        if (encontrada?.estado === 'en_curso' || encontrada?.id_checkin) {
          throw new Error('La reserva ya tiene check-in registrado. Continúe con consumos o check-out.');
        }
        if (encontrada?.estado) {
          throw new Error(`No se puede registrar check-in para una reserva en estado "${encontrada.estado}". Solo aplica para reservas confirmadas.`);
        }
        throw new Error('No se encontró una reserva confirmada para registrar check-in.');
      }
      return request('POST', `/checkin/${reserva.id_reserva}`, body, token);
    },
    registrarPorCodigo: async (codigo, token) => {
      const reserva = await getReservaByIdOrSearch(codigo, token, { operacion: 'checkin' });
      if (!reserva?.id_reserva) {
        const encontrada = await getReservaByIdOrSearch(codigo, token);
        if (encontrada?.estado === 'en_curso' || encontrada?.id_checkin) {
          throw new Error('La reserva ya tiene check-in registrado. Continúe con consumos o check-out.');
        }
        throw new Error('No se encontró una reserva confirmada asociada al código de confirmación.');
      }
      return request('POST', `/checkin/${reserva.id_reserva}`, { documento_verificado: true }, token);
    },
  },

  // ── Check-out ──────────────────────────────────────────────────────────────
  checkout: {
    previo: async (reservaId, token) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token, { operacion: 'checkout' });
      if (!reserva?.id_reserva) {
        const encontrada = await getReservaByIdOrSearch(reservaId, token);
        if (encontrada?.estado === 'confirmada') {
          throw new Error('La reserva todavia no tiene check-in registrado. Primero registre el check-in.');
        }
        if (encontrada?.estado) {
          throw new Error(`No se puede registrar check-out para una reserva en estado "${encontrada.estado}". Solo aplica para reservas en curso.`);
        }
        throw new Error('No se encontro una reserva en curso para generar resumen previo.');
      }
      // Fechas de la reserva ya buscada (siempre strings ISO desde la API de reservas)
      const fechaEntradaFallback = reserva.fecha_entrada ? String(reserva.fecha_entrada) : null;
      const fechaSalidaFallback  = reserva.fecha_salida  ? String(reserva.fecha_salida)  : null;
      try {
        const data = await request('GET', `/checkout/${reserva.id_reserva}/resumen`, null, token);
        // Garantizar que las fechas siempre sean strings (MySQL puede devolver objetos Date)
        return {
          ...data,
          fecha_entrada: data.fecha_entrada ? String(data.fecha_entrada) : fechaEntradaFallback,
          fecha_salida:  data.fecha_salida  ? String(data.fecha_salida)  : fechaSalidaFallback,
        };
      } catch (err) {
        // Si es un error de negocio (422), lo lanzamos para que la UI lo maneje
        if (err.status === 422) throw err;
        return {
          id_reserva: reserva.id_reserva,
          estado: reserva.estado,
          fecha_entrada: fechaEntradaFallback,
          fecha_salida:  fechaSalidaFallback,
          total_facturado: null,
          saldo_pendiente: null,
          consumos: [],
        };
      }
    },
    registrar: async (reservaId, token, body = {}) => {
      const reserva = await getReservaByIdOrSearch(reservaId, token, { operacion: 'checkout' });
      if (!reserva?.id_reserva) {
        const encontrada = await getReservaByIdOrSearch(reservaId, token);
        if (encontrada?.estado === 'confirmada') {
          throw new Error('La reserva todavia no tiene check-in registrado. Primero registre el check-in.');
        }
        if (encontrada?.estado) {
          throw new Error(`No se puede registrar check-out para una reserva en estado "${encontrada.estado}". Solo aplica para reservas en curso.`);
        }
        throw new Error('No se encontro una reserva en curso para registrar check-out.');
      }
      return request('POST', `/checkout/${reserva.id_reserva}`, body, token);
    },
  },

  // ── Facturas ───────────────────────────────────────────────────────────────
  facturas: {
    obtener: async (idReserva, token) => {
      try {
        return await request('GET', `/facturas/reserva/${idReserva}`, null, token);
      } catch {
        return { data: null };
      }
    },
  },

  // ── Consumos ───────────────────────────────────────────────────────────────
  consumos: {
    porReserva: async (reservaId, token) => {
      try {
        const reserva = await getReservaByIdOrSearch(reservaId, token);
        if (!reserva?.id_reserva) return { data: [] };
        return await request('GET', `/consumos/${reserva.id_reserva}`, null, token);
      } catch {
        return { data: [] };
      }
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

  // ── Servicios adicionales (requiere token) ─────────────────────────────────
  servicios: {
    listar: async (token) => {
      try {
        return await request('GET', '/servicios', null, token);
      } catch {
        return { data: SERVICIOS_COMPAT, total: SERVICIOS_COMPAT.length };
      }
    },
  },

  // ── Inventario ─────────────────────────────────────────────────────────────
  inventario: {
    listarInsumos: async (token) => {
      try {
        return await request('GET', '/inventario/insumos', null, token);
      } catch {
        return { data: INSUMOS_COMPAT, total: INSUMOS_COMPAT.length };
      }
    },
    stockCritico: async (token) => {
      try {
        const res = await request('GET', '/inventario/alertas', null, token);
        const data = normalizeData(res);
        return data.map((a) => ({
          id_insumo: Number(a.id_insumo),
          nombre: a.nombre,
          stock_actual: Number(a.stock_actual),
          stock_minimo: Number(a.stock_minimo),
          criticidad: a.criticidad,
        }));
      } catch {
        return [];
      }
    },
    historial: async (params, token) => {
      try {
        const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
        return await request('GET', `/inventario/historial${qs}`, null, token);
      } catch {
        return { data: [] };
      }
    },
    alertas: async (token) => {
      try {
        return await request('GET', '/inventario/alertas', null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
    registrarConsumo: (body, token)           => request('POST',  '/inventario/consumo',          body,          token),
    umbral:           (id, umbral, token)     => request('PATCH', `/inventario/${id}/umbral`,     { umbral },    token),
    crearInsumo:      (body, token)           => request('POST',  '/inventario/insumos',           body,          token),
    agregarStock:     (id, cantidad, token)   => request('PATCH', `/inventario/${id}/stock`,       { cantidad },  token),
  },

  // ── Reportes ───────────────────────────────────────────────────────────────
  reportes: {
    ocupacion: async (params, token) => {
      try {
        return await request('GET', `/reportes/ocupacion?${new URLSearchParams(params)}`, null, token);
      } catch {
        return { data: [] };
      }
    },
    ingresos: async (params, token) => {
      try {
        return await request('GET', `/reportes/ingresos?${new URLSearchParams(params)}`, null, token);
      } catch {
        return { data: [] };
      }
    },
  },

  // ── Cuenta huésped ─────────────────────────────────────────────────────────
  cuenta: {
    obtener: async (token) => {
      try {
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
      } catch {
        return { huesped: null, reservas: [], consumos: [], facturas: [], resumen: { total_reservas: 0, total_noches: 0, total_gastado: 0, total_consumos: 0, reservas_activas: 0 } };
      }
    },
  },

  // ── Dashboard Admin ────────────────────────────────────────────────────────
  dashboard: {
    resumen: async (token) => {
      try {
        const [habRes, reservasRes] = await Promise.allSettled([
          request('GET', '/habitaciones?limite=50', null, token),
          request('GET', '/reservas?limite=50', null, token),
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
      } catch {
        return {
          habitaciones: { total: 0, disponible: 0, ocupada: 0, limpieza: 0, mantenimiento: 0, bloqueada: 0 },
          checkinsPendientes: 0,
          checkoutsPendientes: 0,
          reservasMes: { total: 0, ingresos: 0 },
          alertasInventario: 0,
          ingresosMensuales: [],
          reservasPorTipo: [],
          reservasPorCanal: [],
        };
      }
    },
  },

  // ── Auditoría (Administrador) ──────────────────────────────────────────────
  auditoria: {
    filtros: async (token) => {
      try {
        return await request('GET', '/auditoria/filtros', null, token);
      } catch {
        return { acciones: ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'READ'], tablas: [], usuarios: [] };
      }
    },
    listar: async (params, token) => {
      try {
        const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
        return await request('GET', `/auditoria${qs}`, null, token);
      } catch {
        return { data: [], total: 0 };
      }
    },
  },
};
