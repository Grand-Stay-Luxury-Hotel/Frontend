<div align="center">

# Grand Stay · Frontend

**Sistema de gestión hotelera de lujo — Single Page Application**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white&style=for-the-badge)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-6.26.1-CA4245?logo=reactrouter&logoColor=white&style=for-the-badge)](https://reactrouter.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12.7-22B5BF?logo=chartdotjs&logoColor=white&style=for-the-badge)](https://recharts.org/)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![nginx](https://img.shields.io/badge/nginx-alpine-009639?logo=nginx&logoColor=white&style=for-the-badge)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white&style=for-the-badge)](https://www.docker.com/)
[![CSS Variables](https://img.shields.io/badge/Design_System-CSS_Custom_Properties-C9A96E?logo=css3&logoColor=white&style=for-the-badge)](#sistema-de-diseño)

> SPA construida con **React 18 + Vite**, diseño **dark / gold** de lujo, enrutamiento protegido por rol y comunicación con la API REST del backend mediante un proxy Nginx en producción.

</div>

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Estado de desarrollo](#estado-de-desarrollo)
- [Inicio rápido](#inicio-rápido)
- [Scripts disponibles](#scripts-disponibles)
- [Variables de entorno y proxy](#variables-de-entorno-y-proxy)
- [Rutas y control de acceso](#rutas-y-control-de-acceso)
- [Sistema de diseño](#sistema-de-diseño)
- [Componentes y páginas](#componentes-y-páginas)
- [Autenticación y sesión](#autenticación-y-sesión)
- [Docker](#docker)
- [Estructura de carpetas](#estructura-de-carpetas)

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 18.3.1 | Framework UI — componentes funcionales + hooks |
| Vite | 7.x | Bundler + dev server con HMR y proxy integrado |
| React Router DOM | 6.26.1 | Enrutamiento SPA con guards de rol (v7 flags activos) |
| react-datepicker | 9.x | Selector de fechas con tema dark/gold personalizado |
| date-fns | 4.x | Utilidades de fechas (locale `es`) |
| Recharts | 2.12.7 | Gráficos de ocupación, ingresos y estadísticas |
| CSS Custom Properties | — | Design system dark/gold completo sin dependencias externas |
| nginx | alpine | Servidor de producción — sirve la SPA y hace proxy a la API |

> No se usa ningún framework CSS de terceros (sin Tailwind, Bootstrap ni Material UI). Toda la UI se construye sobre variables CSS propias definidas en `src/index.css`.

---

## Arquitectura del proyecto

```
src/
├── main.jsx                  # Entry point — StrictMode + App
├── index.css                 # Design system completo (variables, utilidades, componentes)
├── App.jsx                   # BrowserRouter + árbol de rutas + definición de ROLES
│
├── context/
│   └── AuthContext.jsx       # Estado global de sesión, login/logout, idle-logout, JWT decode
│
├── services/
│   └── api.js                # Capa HTTP — fetch wrapper + métodos por recurso
│
├── utils/
│   ├── penalizacion.js       # Cálculo de penalización por cancelación tardía
│   └── roles.js              # Helpers de rol: isAdmin(), isLimpieza(), isTecnico()
│
├── components/
│   ├── ProtectedRoute.jsx    # Guard de rutas — verifica token + rol
│   ├── Sidebar.jsx           # Navegación lateral del dashboard (responsive)
│   ├── Toast.jsx             # Notificaciones flotantes (provider + hook useToast)
│   ├── GoldDatePicker.jsx    # Date picker con tema dark/gold
│   └── GoldDatePicker.css    # Estilos del calendar popup
│
└── pages/
    ├── Landing.jsx           # Página pública de presentación del hotel
    ├── Login.jsx             # Inicio de sesión (OTP para Administrador)
    ├── Registro.jsx          # Registro de nuevos huéspedes con auto-login
    ├── Dashboard.jsx         # Shell con Sidebar + <Outlet> para rutas anidadas
    ├── DashboardAdmin.jsx    # Panel de control ejecutivo (métricas + gráficos)
    ├── Disponibilidad.jsx    # HU-B01: consulta de habitaciones disponibles
    ├── Reservas.jsx          # HU-B02/B04: crear y cancelar reservas
    ├── CheckIn.jsx           # HU-B05: registro de check-in
    ├── CheckOut.jsx          # HU-B06: registro de check-out y liquidación
    ├── Consumos.jsx          # HU-B08: cargos adicionales durante la estadía
    ├── Habitaciones.jsx      # HU-B07: gestión de estados de habitación
    ├── Inventario.jsx        # HU-B11: control de insumos y alertas de stock
    ├── Reportes.jsx          # HU-B12: reportes estadísticos con gráficos
    ├── Tarifas.jsx           # HU-B13: gestión de tarifas (Admin)
    ├── CuentaHuesped.jsx     # Perfil y reservas del huésped autenticado
    └── Auditoria.jsx         # Registro de auditoría del sistema (Admin)
```

---

## Estado de desarrollo

> Corte al **3 de junio de 2026**.

### Páginas implementadas (16 / 16)

| Módulo | Página | HU asociada | Rol(es) |
|---|---|---|---|
| Público | `Landing` | — | Todos |
| Público | `Login` | — | Todos |
| Público | `Registro` | — | Huésped |
| Shell | `Dashboard` | — | Autenticado |
| Admin | `DashboardAdmin` | HU-B12+ | Administrador |
| Operaciones | `Disponibilidad` | HU-B01 | Recepcionista · Huésped |
| Operaciones | `Reservas` | HU-B02/B04 | Recepcionista · Huésped |
| Operaciones | `CheckIn` | HU-B05 | Recepcionista |
| Operaciones | `CheckOut` | HU-B06 | Recepcionista |
| Operaciones | `Consumos` | HU-B08 | Recepcionista |
| Gestión | `Habitaciones` | HU-B07 | Recepcionista · Admin · Limpieza · Técnico |
| Gestión | `Inventario` | HU-B11 | Administrador · Limpieza |
| Gestión | `Tarifas` | HU-B13 | Administrador |
| Reportes | `Reportes` | HU-B12 | Administrador |
| Cuenta | `CuentaHuesped` | — | Huésped |
| Auditoría | `Auditoria` | — | Administrador |

### Cobertura por capa

| Capa | Archivos | Estado |
|---|---|---|
| Pages | 16 componentes | ✅ Completo |
| Components | 5 componentes reutilizables | ✅ Completo |
| Context | AuthContext con idle-logout | ✅ Completo |
| Services | `api.js` centralizado | ✅ Completo |
| Utils | `penalizacion.js` · `roles.js` | ✅ Completo |
| Design System | CSS Custom Properties (~700 líneas) | ✅ Completo |
| Docker | Multi-stage build (Node → nginx) | ✅ Actualizado |
| Routing | 13 rutas protegidas por rol | ✅ Completo |

---

## Inicio rápido

### Prerrequisitos

- **Node.js** 20 o superior
- Backend Grand-Stay corriendo en `http://localhost:4000` (ver `../Backend/README.md`)

### Instalación

```bash
cd Frontend
npm install
```

### Desarrollo

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`. Vite hace proxy de todas las peticiones `/api/*` al backend en `http://localhost:4000` — sin problemas de CORS en desarrollo.

### Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` con los assets optimizados. Para previsualizar el build localmente:

```bash
npm run preview
```

---

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `vite` | Dev server con HMR en puerto 5173 |
| `build` | `vite build` | Bundle optimizado en `dist/` |
| `preview` | `vite preview` | Sirve el build de producción localmente |
| `start` | `node server.mjs` | Servidor estático de respaldo (legacy) |

---

## Variables de entorno y proxy

No se requieren variables de entorno para desarrollo. La configuración del proxy en desarrollo está en `vite.config.js`:

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

En **producción** (Docker), el proxy lo gestiona **nginx** directamente via `nginx.conf`:

```nginx
location /api {
    rewrite ^/api(.*)$ $1 break;
    proxy_pass http://grandstay-backend:4000;
}
```

Todas las llamadas de `src/services/api.js` usan el prefijo `/api`, funcionando igual en ambos entornos.

---

## Rutas y control de acceso

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Landing | Público |
| `/login` | Login | Público |
| `/registro` | Registro | Público |
| `/dashboard` | Dashboard shell | Autenticado (redirige según rol) |
| `/dashboard/overview` | DashboardAdmin | Administrador |
| `/dashboard/disponibilidad` | Disponibilidad | Recepcionista · Huésped |
| `/dashboard/reservas` | Reservas | Recepcionista · Huésped |
| `/dashboard/checkin` | Check-in | Recepcionista |
| `/dashboard/checkout` | Check-out | Recepcionista |
| `/dashboard/consumos` | Consumos | Recepcionista |
| `/dashboard/habitaciones` | Habitaciones | Recepcionista · Admin · Limpieza · Técnico |
| `/dashboard/inventario` | Inventario | Administrador · Limpieza |
| `/dashboard/tarifas` | Tarifas | Administrador |
| `/dashboard/reportes` | Reportes | Administrador |
| `/dashboard/cuenta` | CuentaHuesped | Huésped |
| `/dashboard/auditoria` | Auditoria | Administrador |
| `/*` | → `/` | — |

> La protección se implementa en `ProtectedRoute.jsx`. Verifica token válido en sesión y, si se pasa la prop `roles`, que el rol del usuario esté incluido. Los accesos no autorizados redirigen a `/` o `/login`.

> El `AuthContext` incluye **idle-logout automático** a los 15 minutos de inactividad, notificado via Toast.

---

## Sistema de diseño

Todo el diseño vive en `src/index.css` a través de CSS Custom Properties. No hay dependencia de librerías de estilos externas.

### Paleta principal

| Variable | Valor | Uso |
|---|---|---|
| `--c-bg` | `#070707` | Fondo principal |
| `--c-surface` | `#0f0f0f` | Superficies elevadas (cards, sidebar) |
| `--c-gold` | `#c9a96e` | Acento dorado principal |
| `--c-gold-light` | `#e2c99a` | Dorado para hover / active |
| `--c-text` | `#f4efe6` | Texto primario |
| `--c-text-2` | `#a09080` | Texto secundario / subtítulos |
| `--c-border` | `rgba(201,169,110,0.15)` | Bordes sutiles |

### Tipografía

| Familia | Tipo | Uso |
|---|---|---|
| `Playfair Display` | Serif | Headings, títulos de sección |
| `Inter` | Sans-serif | Body, labels, tablas, formularios |

### Clases de utilidad

```
Botones:     .btn .btn-gold .btn-outline .btn-ghost .btn-danger .btn-sm .btn-lg .btn-full
Formularios: .form-group .form-label .form-input .form-select .form-textarea .form-grid
Cards:       .card .card-gold
Alertas:     .alert .alert-success .alert-error .alert-warning .alert-info
Badges:      .badge .badge-gold .badge-success .badge-error .badge-warning .badge-info
Tablas:      .table-wrap .table
Modales:     .modal-overlay .modal .modal-header .modal-footer .modal-close
Estados:     .spinner-wrap .spinner .empty-state .page-header .eyebrow .gold-line
```

### GoldDatePicker

Componente `src/components/GoldDatePicker.jsx` que envuelve `react-datepicker` con el tema dark/gold del proyecto.

```jsx
<GoldDatePicker
  value="2026-06-01"          // ISO string YYYY-MM-DD
  onChange={(iso) => setFecha(iso)}
  minDate={new Date()}
  placeholder="Fecha de entrada"
/>
```

---

## Componentes y páginas

### `AuthContext`

Proveedor de sesión global. Expone `{ auth, login, logout }` mediante el hook `useAuth()`.

- `auth` contiene: `{ token, email, rol, id_usuario, id_huesped, id_recepcionista, id_personal, id_admin }`
- La sesión se persiste en `sessionStorage` bajo la clave `gs_auth`
- El token JWT se decodifica en el cliente para extraer el payload sin llamadas adicionales al backend
- Incluye listener de **idle-logout** a los 15 minutos de inactividad

```jsx
const { auth, login, logout } = useAuth();
```

### `api.js`

Wrapper sobre `fetch` que centraliza todas las llamadas HTTP. Prefija con `/api`, serializa/deserializa JSON y lanza errores con el mensaje del servidor.

```js
const data  = await api.auth.login({ usuario, password });
const data  = await api.auth.registro({ nombre, apellido, email, password });
const rooms = await api.disponibilidad.consultar({ fechaEntrada, fechaSalida }, token);
await api.reservas.crear(body, token);
await api.checkin.registrar(reservaId, body, token);
```

### `roles.js`

Helpers que abstraen la lógica de normalización de roles con variaciones tipográficas:

```js
import { isAdmin, isLimpieza, isTecnico } from './utils/roles.js';
```

### `Toast`

Sistema de notificaciones no bloqueante. El hook `useToast()` expone `addToast(mensaje, tipo)`.

```jsx
const { addToast } = useToast();
addToast('Reserva creada exitosamente', 'success');
addToast('Error al conectar con el servidor', 'error');
```

Tipos: `success` · `error` · `warning` · `info`

---

## Autenticación y sesión

### Flujo de login (staff)

1. Usuario va a `/login` e ingresa email + password (+ OTP si es Administrador)
2. `POST /api/auth/login` → backend devuelve `{ token, usuario }`
3. `login(data)` en `AuthContext` decodifica el JWT y guarda la sesión en `sessionStorage`
4. React Router redirige al dashboard según el rol (index route con `DashboardIndex`)

### Flujo de registro (huéspedes)

1. Usuario va a `/registro` e ingresa sus datos personales
2. `POST /api/auth/registro` → backend crea `usuario` + `huesped` y devuelve JWT
3. Auto-login mediante `login(data)` y redirección a `/dashboard/disponibilidad`

### Logout

```js
const { logout } = useAuth();
logout(); // limpia sessionStorage y restablece el estado global
```

---

## Docker

El servicio se containeriza mediante un **build multi-stage** optimizado para producción. Ver [`DOCKER.md`](./DOCKER.md) para instrucciones completas.

### Arquitectura del contenedor

```
Stage 1 — builder (node:20-alpine)
  └─ npm ci + npm run build → genera /app/dist

Stage 2 — production (nginx:alpine)
  └─ copia /app/dist → /usr/share/nginx/html
  └─ nginx.conf → sirve la SPA + proxy /api → grandstay-backend:4000
  └─ puerto 80 expuesto con healthcheck
```

### Comandos

```powershell
# Construir y levantar
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Detener y eliminar contenedores
docker compose down
```

### Healthcheck

El contenedor verifica su propia disponibilidad cada 30 segundos:

```
GET http://localhost:80/ → 200 OK
```

> **Nota de red:** En el stack completo, el contenedor frontend debe estar en la misma red Docker que el backend (`grandstay-net`) para que el proxy nginx resuelva `grandstay-backend:4000`.

---

## Estructura de carpetas

```
Frontend/
├── Dockerfile              # Multi-stage: node:20-alpine (build) → nginx:alpine (serve)
├── docker-compose.yml      # Servicio grandstay-frontend en puerto 80
├── nginx.conf              # Configuración nginx: SPA + proxy /api → backend
├── DOCKER.md               # Instrucciones detalladas de Docker
├── server.mjs              # Servidor HTTP estático de respaldo (legacy)
├── index.html              # Entry point HTML (referencia a /src/main.jsx vía Vite)
├── styles.css              # CSS base global
├── vite.config.js          # Configuración Vite + proxy de desarrollo
├── package.json
└── src/
    ├── main.jsx
    ├── index.css           # Design system completo (CSS Custom Properties)
    ├── App.jsx             # Router raíz + definición de ROLES + idle-logout listener
    ├── context/
    │   └── AuthContext.jsx
    ├── services/
    │   └── api.js
    ├── utils/
    │   ├── penalizacion.js
    │   └── roles.js
    ├── components/
    │   ├── GoldDatePicker.jsx
    │   ├── GoldDatePicker.css
    │   ├── ProtectedRoute.jsx
    │   ├── Sidebar.jsx
    │   └── Toast.jsx
    └── pages/
        ├── Landing.jsx
        ├── Login.jsx
        ├── Registro.jsx
        ├── Dashboard.jsx
        ├── DashboardAdmin.jsx
        ├── Disponibilidad.jsx
        ├── Reservas.jsx
        ├── CheckIn.jsx
        ├── CheckOut.jsx
        ├── Consumos.jsx
        ├── Habitaciones.jsx
        ├── Inventario.jsx
        ├── Tarifas.jsx
        ├── Reportes.jsx
        ├── CuentaHuesped.jsx
        └── Auditoria.jsx
```
