# Historias de Usuario Frontend - Grand-Stay

Fuente base: `HU Grand Stay.docx`  
Revision contra codigo: `Frontend/src`  
Fecha de revision: 2026-05-16

## Resumen

| Estado | Cantidad |
| --- | ---: |
| Implementadas | 1 |
| Parciales | 9 |
| Pendientes | 2 |

## Criterio de estado

- **Implementada:** existe pantalla/flujo principal y cumple los criterios centrales de la HU.
- **Parcial:** existe pantalla o parte del flujo, pero faltan criterios importantes.
- **Pendiente:** no existe pantalla, ruta o servicio frontend que cubra la HU.

## Tabla general

| ID | Historia de usuario | Modulo | Prioridad | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| HU-F01 | Panel de busqueda de disponibilidad | Reservas | Alta | Implementada | `Disponibilidad.jsx`, datepickers, filtros y tarjetas de resultados |
| HU-F02 | Formulario de creacion de reserva | Reservas | Alta | Parcial | `Reservas.jsx` crea reservas, pero usa IDs y token manual; no captura datos completos del huesped ni widget real de pago |
| HU-F03 | Gestion de reservas activas | Reservas | Alta | Parcial | `Reservas.jsx` permite cancelar por ID; no hay listado activo, buscador ni modificacion |
| HU-F04 | Pantalla de Check-in | Check-in / Check-out | Alta | Parcial | `CheckIn.jsx` ejecuta check-in por ID; no muestra datos de reserva ni voucher |
| HU-F05 | Pantalla de Check-out con factura previa | Check-in / Check-out | Alta | Parcial | `CheckOut.jsx` liquida por ID; no muestra factura previa ni permite consumo de ultimo momento |
| HU-F06 | Mapa visual de estados de habitaciones | Habitaciones | Alta | Parcial | `Habitaciones.jsx` actualiza estado por ID; no hay grilla/mapa, panel lateral ni polling |
| HU-F07 | Formulario de registro de consumos adicionales | Servicios Adicionales | Alta | Parcial | `Consumos.jsx` registra consumos; no lista solo habitaciones ocupadas ni muestra huesped |
| HU-F08 | Pantalla de inicio de sesion con 2FA para Administrador | Seguridad | Alta | Parcial | `Login.jsx` soporta OTP; no se encontro expiracion automatica por 15 minutos de inactividad |
| HU-F09 | Panel de gestion de tarifas de temporada | Administracion | Alta | Pendiente | No hay pagina, ruta ni API frontend para tarifas |
| HU-F10 | Panel de inventario de insumos con alertas visuales | Inventario | Media | Parcial | `Inventario.jsx` muestra alertas y actualiza umbral; falta tabla completa de stock y badge rojo en menu |
| HU-F11 | Dashboard ejecutivo con graficas de ocupacion e ingresos | Reportes | Media | Parcial | `Reportes.jsx` usa Recharts; falta exportar a PDF y algunos indicadores requeridos |
| HU-F12 | Consulta de cuenta del huesped en tiempo real | Comunicaciones | Alta | Pendiente | No hay pagina/ruta para cuenta del huesped ni enlace de solo lectura |

## HU implementadas

### HU-F01 - Panel de busqueda de disponibilidad

**Estado:** Implementada

**Implementado:**
- Pantalla `Disponibilidad.jsx`.
- Campos de fecha de entrada, fecha de salida, tipo y capacidad.
- Datepicker personalizado `GoldDatePicker`.
- Validacion de fecha de salida mediante `minDate`.
- Consulta a `GET /habitaciones/disponibilidad`.
- Resultados en tarjetas con datos de habitacion.
- Mensaje cuando no hay disponibilidad.
- Accion para pasar a creacion de reserva con habitacion preseleccionada.

## HU parciales

### HU-F02 - Formulario de creacion de reserva

**Estado:** Parcial

**Implementado:**
- Formulario en `Reservas.jsx`.
- Permite crear reserva con huesped, habitacion, fechas, anticipo, token de pago y observaciones.
- Integra llamada `POST /reservas`.
- Muestra confirmacion basica de exito/error.

**Falta o requiere ajuste:**
- El criterio pide nombre completo, documento, correo y telefono; la pantalla usa `id_huesped`.
- No hay resumen automatico de costos con tarifa por noches e impuestos.
- No hay widget seguro real de pasarela; se captura token manual.
- No hay pantalla de exito con imprimir o enviar por correo.

### HU-F03 - Gestion de reservas activas

**Estado:** Parcial

**Implementado:**
- Se puede cancelar una reserva desde `Reservas.jsx` usando el ID.
- Hay modal de confirmacion.
- Se muestra la politica de penalizacion.

**Falta o requiere ajuste:**
- No hay listado de reservas activas.
- No hay buscador por nombre o numero de reserva.
- No hay modificacion de reservas.
- El modal no muestra la penalizacion real calculada antes de ejecutar; solo informa la politica.
- No hay indicadores visuales por estado de reserva.

### HU-F04 - Pantalla de Check-in

**Estado:** Parcial

**Implementado:**
- Pantalla `CheckIn.jsx`.
- Permite ejecutar check-in por `reservaId`.
- Incluye confirmacion de documento verificado.
- Integra llamada `POST /checkin/:reservaId`.
- Muestra estado de carga y resultado.

**Falta o requiere ajuste:**
- No muestra datos completos de la reserva antes de confirmar.
- No captura numero de documento; solo checkbox de verificacion.
- No muestra codigo de acceso devuelto por backend.
- No ofrece impresion de voucher.

### HU-F05 - Pantalla de Check-out con factura previa

**Estado:** Parcial

**Implementado:**
- Pantalla `CheckOut.jsx`.
- Procesa check-out por `reservaId`.
- Integra llamada `POST /checkout/:reservaId`.
- Muestra loading y resultado basico.

**Falta o requiere ajuste:**
- No muestra desglose previo de factura antes de cobrar.
- No permite agregar consumo adicional desde el mismo flujo.
- No muestra factura final completa en pantalla.
- No ofrece imprimir.
- No confirma visualmente el envio del PDF al correo del huesped.

### HU-F06 - Mapa visual de estados de habitaciones

**Estado:** Parcial

**Implementado:**
- Pantalla `Habitaciones.jsx`.
- Permite cambiar estado de una habitacion por ID.
- Muestra estados con badges de color.
- Respeta proteccion por rol en rutas.

**Falta o requiere ajuste:**
- No hay mapa o grilla visual de todas las habitaciones.
- No hay tarjeta por habitacion con numero, tipo y estado.
- No hay panel lateral de detalle.
- No hay acciones dinamicas por rol dentro de cada habitacion.
- No hay actualizacion automatica cada 30 segundos.

### HU-F07 - Formulario de registro de consumos adicionales

**Estado:** Parcial

**Implementado:**
- Pantalla `Consumos.jsx`.
- Campos de habitacion, tipo, descripcion, cantidad y precio unitario.
- Calculo de total en pantalla.
- Integra llamada `POST /consumos`.
- Muestra exito/error.

**Falta o requiere ajuste:**
- El campo de habitacion es un ID manual, no selector filtrado a habitaciones ocupadas.
- No muestra nombre del huesped al seleccionar habitacion.
- No muestra total acumulado devuelto por backend de forma clara.
- La validacion de habitacion ocupada depende del backend, no de la UI.

### HU-F08 - Pantalla de inicio de sesion con 2FA para Administrador

**Estado:** Parcial

**Implementado:**
- Pantalla `Login.jsx`.
- Solicita usuario y password.
- Password enmascarado.
- Soporta campo OTP cuando backend responde que es requerido.
- Mensajes de error genericos desde backend.
- Guarda sesion en `sessionStorage`.

**Falta o requiere ajuste:**
- El flujo de OTP aparece despues de un intento fallido por OTP, no como segunda pantalla tras validar credenciales.
- No se encontro expiracion automatica por 15 minutos de inactividad.

### HU-F10 - Panel de inventario de insumos con alertas visuales

**Estado:** Parcial

**Implementado:**
- Pantalla `Inventario.jsx`.
- Tab de alertas para administrador.
- Tabla de alertas con criticidad.
- Registro de consumo de inventario.
- Actualizacion de umbral minimo.
- Proteccion por rol.

**Falta o requiere ajuste:**
- No muestra tabla completa de todos los insumos con stock actual, stock minimo y estado OK/Alerta/Critico.
- No hay edicion en linea dentro de la misma tabla; se usa formulario separado.
- No se encontro contador de alertas activas como badge rojo en navegacion principal.

### HU-F11 - Dashboard ejecutivo con graficas de ocupacion e ingresos

**Estado:** Parcial

**Implementado:**
- Pantalla `Reportes.jsx`.
- Grafica de barras para ocupacion.
- Grafica de torta para ingresos.
- Filtros de mes/anio y rango de fechas.
- Uso de `Recharts`.
- Consumo de endpoints `reportes/ocupacion` y `reportes/ingresos`.

**Falta o requiere ajuste:**
- No hay boton `Exportar a PDF`.
- No se encontro ranking dedicado de servicios adicionales mas rentables.
- No hay dashboard consolidado en una sola vista; se trabaja por tabs.
- Rendimiento de 10 segundos no esta verificado en frontend.

## HU pendientes

### HU-F09 - Panel de gestion de tarifas de temporada

**Estado:** Pendiente

**Falta implementar:**
- Ruta protegida para Administrador.
- Listado de tarifas activas.
- Formulario de crear/editar/eliminar tarifas.
- Validacion de solapamiento de periodos.
- Confirmaciones por accion.
- Integracion con backend, que actualmente tampoco expone endpoints de tarifas.

### HU-F12 - Consulta de cuenta del huesped en tiempo real

**Estado:** Pendiente

**Falta implementar:**
- Pantalla de cuenta del huesped.
- Listado de cargos de estancia y consumos.
- Total acumulado en tiempo real o con actualizacion automatica.
- Enlace de solo lectura compartible.
- Formato de moneda local e impuestos desglosados.
- Endpoint backend dedicado para consultar cuenta por reserva/huesped o token publico.

## Observaciones tecnicas

- El frontend tiene rutas principales y control de acceso por rol en `App.jsx`.
- La capa HTTP centralizada esta en `src/services/api.js`.
- Hay una llamada frontend a `POST /auth/registro`, pero el backend actual no expone esa ruta; el flujo de registro de huespedes puede fallar si no se agrega el endpoint.
- Muchas HU estan creadas como pantalla operativa minima, pero no como flujo completo segun todos los criterios de aceptacion del documento.
