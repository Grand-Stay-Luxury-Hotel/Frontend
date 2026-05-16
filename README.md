# Grand-Stay · Frontend

Interfaz de usuario del sistema de gestión hotelera **Grand Stay**. SPA construida con **React 18 + Vite 5**, diseño dark/gold de lujo, enrutamiento protegido por rol y comunicación con la API REST del backend.

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
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
| React | 18.3.1 | Framework UI |
| Vite | 5.4.2 | Bundler + dev server |
| React Router DOM | 6.26.1 | Enrutamiento SPA con protección por rol |
| react-datepicker | 9.x | Selector de fechas con tema personalizado |
| date-fns | 4.x | Utilidades de fechas (locale es) |
| Recharts | 2.12.7 | Gráficos de ocupación e ingresos |
| CSS Custom Properties | — | Design system dark/gold sin dependencias |

No se usa ningún framework CSS de terceros (sin Tailwind, Bootstrap ni Material UI). Toda la UI se construye sobre variables CSS propias definidas en `src/index.css`.

---

## Arquitectura del proyecto

```
src/
├── main.jsx                # Entry point — StrictMode + App
├── index.css               # Design system completo (~700 líneas de variables y utilidades)
├── App.jsx                 # BrowserRouter + árbol de rutas + ROLES
│
├── context/
│   └── AuthContext.jsx     # Estado global de sesión, login/logout, decodificación JWT
│
├── services/
│   └── api.js              # Capa HTTP — fetch wrapper + métodos por recurso
│
├── utils/
│   └── penalizacion.js     # Cálculo de penalización por cancelación tardía
│
├── components/
│   ├── ProtectedRoute.jsx  # Guard de rutas por rol
│   ├── Sidebar.jsx         # Navegación lateral del dashboard
│   ├── Toast.jsx           # Notificaciones flotantes (provider + hook)
│   ├── GoldDatePicker.jsx  # Date picker con tema dark/gold
│   └── GoldDatePicker.css  # Estilos del calendar popup
│
└── pages/
    ├── Landing.jsx         # Página pública de presentación del hotel
    ├── Login.jsx           # Inicio de sesión con soporte OTP para Administrador
    ├── Registro.jsx        # Registro de nuevos huéspedes (auto-login)
    ├── Dashboard.jsx       # Shell con Sidebar + <Outlet> para páginas anidadas
    ├── Disponibilidad.jsx  # HU-B01: consulta de habitaciones disponibles
    ├── Reservas.jsx        # HU-B02/B04: crear y cancelar reservas
    ├── CheckIn.jsx         # HU-B05: registro de check-in
    ├── CheckOut.jsx        # HU-B06: registro de check-out y liquidación
    ├── Consumos.jsx        # HU-B08: cargos adicionales durante la estadía
    ├── Habitaciones.jsx    # HU-B07: gestión de estados de habitación
    ├── Inventario.jsx      # HU-B11: control de insumos y alertas de stock
    └── Reportes.jsx        # HU-B12: reportes estadísticos con gráficos
```

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

La app queda disponible en `http://localhost:5173`. El dev server de Vite hace proxy de todas las peticiones `/api/*` al backend en `http://localhost:4000`, por lo que no hay problemas de CORS en desarrollo.

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
| `start` | `node server.mjs` | Servidor estático mínimo (usado en Docker) |

---

## Variables de entorno y proxy

No se requieren variables de entorno para desarrollo. La configuración del proxy está en `vite.config.js`:

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

Todas las llamadas de `src/services/api.js` usan el prefijo `/api`, por lo que en desarrollo se redirigen automáticamente al backend sin necesidad de configurar CORS en el cliente.

---

## Rutas y control de acceso

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Landing | Público |
| `/login` | Login | Público |
| `/registro` | Registro | Público |
| `/dashboard` | Dashboard shell | Autenticado (cualquier rol) |
| `/dashboard/disponibilidad` | Disponibilidad | Autenticado |
| `/dashboard/reservas` | Reservas | Recepcionista · Administrador · Huesped |
| `/dashboard/checkin` | Check-in | Recepcionista |
| `/dashboard/checkout` | Check-out | Recepcionista |
| `/dashboard/consumos` | Consumos | Recepcionista |
| `/dashboard/habitaciones` | Habitaciones | Recepcionista · Administrador · PersonalLimpieza |
| `/dashboard/inventario` | Inventario | Administrador · PersonalLimpieza |
| `/dashboard/reportes` | Reportes | Administrador |

La protección se implementa en `ProtectedRoute.jsx`: verifica que exista un token válido en sesión y, si se pasa la prop `roles`, valida que el rol del usuario esté incluido. Cualquier acceso no autorizado redirige a `/` o `/login` según corresponda.

---

## Sistema de diseño

Todo el diseño vive en `src/index.css` a través de CSS Custom Properties. No hay dependencia de librerías de estilos externas.

### Paleta principal

| Variable | Valor | Uso |
|---|---|---|
| `--c-bg` | `#070707` | Fondo principal |
| `--c-surface` | `#0f0f0f` | Superficies elevadas (cards, sidebar) |
| `--c-gold` | `#c9a96e` | Acento dorado principal |
| `--c-gold-light` | `#e2c99a` | Dorado para hover/active |
| `--c-text` | `#f4efe6` | Texto primario |
| `--c-text-2` | `#a09080` | Texto secundario / subtítulos |
| `--c-border` | `rgba(201,169,110,0.15)` | Bordes sutiles |

### Tipografía

- **Headings:** `Playfair Display` (serif, Google Fonts)
- **Body:** `Inter` (sans-serif, Google Fonts)

### Clases de utilidad disponibles

```
Botones:    .btn .btn-gold .btn-outline .btn-ghost .btn-danger .btn-sm .btn-lg .btn-full
Formularios: .form-group .form-label .form-input .form-select .form-textarea .form-grid
Cards:      .card .card-gold
Alertas:    .alert .alert-success .alert-error .alert-warning .alert-info
Badges:     .badge .badge-gold .badge-success .badge-error .badge-warning .badge-info
Tablas:     .table-wrap .table
Modales:    .modal-overlay .modal .modal-header .modal-footer .modal-close
Estados:    .spinner-wrap .spinner .empty-state .page-header .eyebrow .gold-line
```

### GoldDatePicker

Componente `src/components/GoldDatePicker.jsx` que envuelve `react-datepicker` con el tema dark/gold del proyecto. Se usa en todas las páginas con selección de fechas.

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
- El token JWT se decodifica en el cliente para extraer el payload sin llamar al backend

```jsx
const { auth, login, logout } = useAuth();
```

### `api.js`

Wrapper sobre `fetch` que centraliza todas las llamadas HTTP. Prefija con `/api`, serializa/deserializa JSON y lanza errores con el mensaje del servidor.

```js
// Ejemplos de uso
const data = await api.auth.login({ usuario, password });
const data = await api.auth.registro({ nombre, apellido, email, password });
const rooms = await api.disponibilidad.consultar({ fechaEntrada, fechaSalida }, token);
await api.reservas.crear(body, token);
await api.checkin.registrar(reservaId, body, token);
```

### `Toast`

Sistema de notificaciones no bloqueante. El hook `useToast()` expone `addToast(mensaje, tipo)`.

```jsx
const { addToast } = useToast();
addToast('Reserva creada exitosamente', 'success');
addToast('Error al conectar con el servidor', 'error');
```

Tipos disponibles: `success` · `error` · `warning` · `info`

---

## Autenticación y sesión

### Flujo de login (staff)

1. Usuario va a `/login` e ingresa email + password (+ OTP si es Administrador)
2. `POST /api/auth/login` → backend devuelve `{ token, usuario }`
3. `login(data)` en `AuthContext` decodifica el JWT y guarda la sesión en `sessionStorage`
4. React Router redirige al dashboard (o a la ruta indicada por `?redirect=`)

### Flujo de registro (huéspedes)

1. Usuario va a `/registro` e ingresa sus datos personales
2. `POST /api/auth/registro` → backend crea `usuario` + `huesped` y devuelve JWT
3. Auto-login mediante `login(data)` y redirección a `/dashboard/disponibilidad`

### Logout

```js
const { logout } = useAuth();
logout(); // limpia sessionStorage y restablece el estado
```

---

## Docker

El servicio se containeriza de forma independiente. Ver [`DOCKER.md`](./DOCKER.md) para instrucciones completas.

La imagen usa `node:20-alpine` e incluye un servidor estático mínimo (`server.mjs`) que sirve el contenido del directorio raíz en el puerto `5173`.

```powershell
# Levantar
docker compose up -d --build

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

> **Nota:** Para un despliegue completo de la SPA de React en producción, ejecuta `npm run build` antes de construir la imagen y ajusta el Dockerfile para copiar la carpeta `dist/` y servirla con el servidor estático de tu elección.

---

## Estructura de carpetas

```
Frontend/
├── Dockerfile              # Imagen node:20-alpine con server.mjs
├── docker-compose.yml      # Servicio grandstay-frontend en puerto 5173
├── DOCKER.md               # Instrucciones detalladas de Docker
├── server.mjs              # Servidor HTTP estático para producción/Docker
├── index.html              # Entry point HTML (referencia a /src/main.jsx vía Vite)
├── styles.css              # CSS base global
├── package.json
└── src/
    ├── main.jsx
    ├── index.css           # Design system completo
    ├── App.jsx             # Router raíz
    ├── context/
    │   └── AuthContext.jsx
    ├── services/
    │   └── api.js
    ├── utils/
    │   └── penalizacion.js
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
        ├── Disponibilidad.jsx
        ├── Reservas.jsx
        ├── CheckIn.jsx
        ├── CheckOut.jsx
        ├── Consumos.jsx
        ├── Habitaciones.jsx
        ├── Inventario.jsx
        └── Reportes.jsx
```