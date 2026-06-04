export const ROLE_KEYS = {
  admin: 'administrador',
  recepcionista: 'recepcionista',
  limpieza: 'personallimpieza',
  tecnico: 'serviciotecnico',
  huesped: 'huesped',
};

export const ROLE_LABELS = {
  [ROLE_KEYS.admin]: 'Administrador',
  [ROLE_KEYS.recepcionista]: 'Recepcionista',
  [ROLE_KEYS.limpieza]: 'Personal de Limpieza',
  [ROLE_KEYS.tecnico]: 'Servicio Tecnico',
  [ROLE_KEYS.huesped]: 'Huesped',
};

export function normalizeRole(role) {
  const key = String(role ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

  const aliases = {
    admin: ROLE_KEYS.admin,
    administrador: ROLE_KEYS.admin,
    recepcionista: ROLE_KEYS.recepcionista,
    limpieza: ROLE_KEYS.limpieza,
    personallimpieza: ROLE_KEYS.limpieza,
    personaldelimpieza: ROLE_KEYS.limpieza,
    serviciotecnico: ROLE_KEYS.tecnico,
    serviciodetecnico: ROLE_KEYS.tecnico,
    tecnico: ROLE_KEYS.tecnico,
    huesped: ROLE_KEYS.huesped,
  };

  return aliases[key] ?? key;
}

export function hasRole(role, allowed = []) {
  if (!allowed.length) return true;
  const current = normalizeRole(role);
  return allowed.map(normalizeRole).includes(current);
}

export function isAdmin(role) {
  return normalizeRole(role) === ROLE_KEYS.admin;
}

export function isRecepcionista(role) {
  return normalizeRole(role) === ROLE_KEYS.recepcionista;
}

export function isLimpieza(role) {
  return normalizeRole(role) === ROLE_KEYS.limpieza;
}

export function isTecnico(role) {
  return normalizeRole(role) === ROLE_KEYS.tecnico;
}

export function isHuesped(role) {
  return normalizeRole(role) === ROLE_KEYS.huesped;
}
