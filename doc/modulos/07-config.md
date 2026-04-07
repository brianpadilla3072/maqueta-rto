# Módulo 7 — Configuración del sistema

**Ruta:** `/config`
**Usuario:** Director exclusivamente (rol `DIRECTOR`)
**Fase:** 1 — MVP

---

## Descripción

Panel de configuración global del taller. Solo el Director puede acceder. Los cambios afectan el comportamiento de todo el sistema: precios que se calculan en el turnero, capacidad del motor de cola, horarios disponibles en el calendario.

---

## Secciones

### 1. Precios

Tabla editable con el precio por combinación de tipo de vehículo × tipo de carga.

| Tipo de vehículo | Tipo de carga | Precio |
|---|---|---|
| Carga | Peligrosa | $15.000 |
| Carga | Común | $12.000 |
| Particular | — | $10.000 |
| Pasajeros M1 | — | $11.000 |
| Pasajeros M2 | — | $13.000 |
| Pasajeros M3 | — | $14.000 |

- Los precios se almacenan en `ConfigTaller.precios` (JSON)
- Al guardar: `PATCH /config/precios`
- Los cambios aplican a los turnos nuevos — no afectan turnos ya creados
- Se usa `Mantine NumberInput` con formato de moneda argentina

---

### 2. Horarios de atención

| Campo | Valor | Descripción |
|---|---|---|
| Días hábiles | Lun - Vie (checkboxes) | Días en que el taller opera |
| Hora de apertura | 08:00 | Primer slot disponible |
| Hora de cierre | 17:00 | No se toman turnos después |
| Feriados | Lista de fechas | Bloquea esos días en el calendario |

- Almacenado en `ConfigTaller.horarios` (JSON)
- Al guardar: `PATCH /config/horarios`
- Los feriados se pueden agregar/eliminar individualmente

---

### 3. Capacidad por línea

| Línea | Revisiones/hora | Activa |
|---|---|---|
| Línea 1 | 4 | ✓ |
| Línea 2 | 3 | ✓ |

- La capacidad/hora afecta directamente al motor de cola
- "Activa" permite desactivar una línea sin eliminarla (si un técnico falta)
- Al guardar: `PATCH /config/lineas`
- Cambiar la capacidad no afecta los ColaItems ya creados hoy — aplica desde el día siguiente

---

### 4. Datos fiscales del taller

| Campo | Valor |
|---|---|
| Razón social | [nombre del taller] |
| CUIT | [CUIT] |
| Punto de venta | [número] |
| Domicilio | [dirección] |

- Almacenado en `ConfigTaller.datosFiscales` (JSON)
- Se usan para el encabezado del ticket interno
- Al guardar: `PATCH /config/datos-fiscales`

---

### 5. Gestión de usuarios

Tabla de todos los operadores del sistema.

| Nombre | Email | Rol | Línea | Estado | Acciones |
|---|---|---|---|---|---|
| Carlos García | carlos@taller.com | Técnico | Línea 1 | Activo | [Editar] [Desactivar] |
| María López | maria@taller.com | Cajera | — | Activo | [Editar] [Desactivar] |

**Alta de usuario:**
- Formulario: nombre, email, rol, línea asignada (si es Técnico)
- El sistema envía email con contraseña temporal (o la muestra en pantalla para que el Director la comparta)

**Cambio de rol:**
- El Director puede cambiar el rol de cualquier usuario
- Un cambio de TECNICO a otro rol limpia la `lineaId`

**Desactivar usuario:**
- El usuario no puede iniciar sesión
- Sus datos históricos se conservan (para auditoría)
- No se elimina de la base de datos

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/config` | Configuración completa del taller | Director |
| PATCH | `/config/precios` | Actualizar precios | Director |
| PATCH | `/config/horarios` | Actualizar horarios y feriados | Director |
| PATCH | `/config/lineas` | Actualizar capacidad y estado de líneas | Director |
| PATCH | `/config/datos-fiscales` | Actualizar datos fiscales | Director |
| GET | `/usuarios` | Lista de usuarios | Director |
| POST | `/usuarios` | Crear usuario | Director |
| PATCH | `/usuarios/:id` | Editar usuario | Director |
| PATCH | `/usuarios/:id/desactivar` | Desactivar usuario | Director |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Director desactiva una línea con turnos activos | La línea sigue procesando los turnos actuales. No acepta nuevos a partir de ese momento. |
| Director reduce la capacidad/hora de una línea a la mitad | El motor de cola toma el nuevo valor en el siguiente ciclo. Los turnos ya asignados no se mueven. |
| Director intenta eliminar su propio usuario | Backend devuelve 403. Debe haber siempre al menos un Director activo. |
| Precio cambiado mientras hay turnos reservados sin cobrar | El cobro se calcula al momento del registro (en caja), no al momento de la reserva. La cajera verá el precio actualizado. |
