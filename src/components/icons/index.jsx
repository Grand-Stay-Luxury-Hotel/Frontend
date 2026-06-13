/**
 * Iconos SVG centralizados — sustituye las copias dispersas en
 * Landing.jsx, DisponibilidadPublica.jsx, Habitaciones.jsx, etc.
 *
 * Cada ícono acepta `size` (default 20) y cualquier otro prop SVG
 * (className, style, aria-label, etc).
 *
 *   import { IconUsers, IconBed } from '../components/icons';
 *   <IconUsers size={16} />
 */

const baseProps = (size, strokeWidth = 1.6) => ({
  width: size,
  height: size,
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
});

export function IconUsers({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconBed({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M2 4v16" />
      <path d="M22 8H2" />
      <rect x="2" y="8" width="20" height="10" rx="2" />
      <path d="M6 8V4" />
      <path d="M22 8v12" />
    </svg>
  );
}

export function IconSpa({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
    </svg>
  );
}

export function IconDining({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

export function IconCar({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function IconConcierge({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

export function IconCheck({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconStar({ size = 14, ...rest }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function IconWifi({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

export function IconChevronDown({ size = 12, ...rest }) {
  return (
    <svg {...baseProps(size)} strokeWidth={2} {...rest}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconClose({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconCalendar({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconAlert({ size = 20, ...rest }) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9"  x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ── Iconos del Sidebar (stroke 1.8 por consistencia visual) ── */

export function IconBook({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function IconLogin({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

export function IconLogout({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconCoffee({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

export function IconBox({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function IconChart({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function IconTag({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function IconShield({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function IconUser({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconGrid({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

/* IconBedSimple — variante usada en el Sidebar (path más lineal que IconBed) */
export function IconBedSimple({ size = 16, ...rest }) {
  return (
    <svg {...baseProps(size, 1.8)} {...rest}>
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v6" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
}
