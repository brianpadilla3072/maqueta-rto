# Módulo 3 — Motor de cola y display del galpón

**Rutas:** `/display` (pantalla del galpón)
**Usuario:** Display: nadie (TV pública). Motor: interno (llamado desde kiosk y caja)
**Fase:** 1 — MVP

---

## Descripción

Dos componentes que trabajan juntos:
1. **Motor de cola** — backend service que decide a qué línea va cada vehículo
2. **Display del galpón** — pantalla TV que muestra las patentes activas y sus líneas

---

## Motor de cola

### Responsabilidad
El motor de cola es el único que asigna líneas. Ni el técnico ni la cajera pueden elegir la línea — solo el Director puede hacer override (con log).

### Algoritmo de asignación

```
Al recibir una solicitud de asignación (patente, tipo_prioridad):

1. Obtener líneas activas con capacidad disponible hoy
2. Filtrar líneas que no estén en capacidad máxima ahora mismo
3. Si hay múltiples líneas disponibles → round-robin
   (asignar a la línea con menor cantidad de ítems en cola actualmente)
4. Si hay empate → asignar a la de menor número (Línea 1 primero)
5. Crear ColaItem con:
   - lineaId: línea seleccionada
   - orden: último orden de esa línea + 1
   - prioridad: CON_TURNO o SIN_TURNO
6. Actualizar estado del Turno a EN_ESPERA
```

### Prioridad: CON_TURNO vs SIN_TURNO

Los vehículos con turno siempre se insertan **antes** que los sin turno en la cola de cada línea:

```
Cola Línea 1:
[orden 1] ABC123 — CON_TURNO
[orden 2] DEF456 — CON_TURNO
[orden 3] GHI789 — SIN_TURNO   ← siempre después de los con turno
[orden 4] JKL012 — SIN_TURNO
```

### Control de capacidad

- Cada línea tiene `capacidadPorHora` configurada (ej: Línea 1 = 4, Línea 2 = 3)
- El sistema bloquea una línea cuando el número de ítems activos (`EN_ESPERA` + `INGRESO` + `EN_REVISION`) alcanza la capacidad de la hora actual
- Al finalizar un ítem (`FINALIZADO`), la capacidad se libera automáticamente
- Cuando todas las líneas están bloqueadas → el kiosk muestra "No hay turnos disponibles"

### Control de capacidad diaria

- El sistema calcula cuántos turnos se pueden tomar en el día completo: `sum(capacidadPorHora × horasHabiles)` por línea
- Al alcanzar ese límite → `/turno/nuevo` bloquea la fecha en el calendario
- Se puede reservar un porcentaje de la capacidad para walk-ins (configurable en `ConfigTaller`)

---

## Display del galpón

**Ruta:** `/display`
**Tecnología:** Next.js page con `useEffect` que hace polling cada 10 segundos a `GET /cola/activa`

### Diseño de la pantalla

```
┌─────────────────────────────────────────────────────┐
│              RTO DYNNAMO                            │
├──────────────────────┬──────────────────────────────┤
│    ██ LÍNEA 1 ██     │    ██ LÍNEA 2 ██             │
│    (verde = libre)   │    (rojo = llena)             │
├──────────────────────┼──────────────────────────────┤
│  ABC 123  ← EN LÍNEA │  DEF 456  ← EN LÍNEA         │
│  GHI 789  ← ESPERA   │  JKL 012  ← ESPERA           │
│  MNO 345  ← ESPERA   │                              │
├──────────────────────┴──────────────────────────────┤
│  Hora: 10:35                                        │
└─────────────────────────────────────────────────────┘
```

### Indicador de color por línea
- **Verde** — línea operativa con capacidad disponible (< 80% ocupada)
- **Amarillo** — línea casi llena (80-99% ocupada)
- **Rojo** — línea al tope o bloqueada

### Datos mostrados
- Patente del vehículo
- Estado actual del ítem: `EN LÍNEA` o `ESPERA`
- Solo los ítems activos (`EN_ESPERA`, `INGRESO`, `EN_REVISION`)
- Ordenados por `orden` de la cola

### Polling
- `useEffect` con `setInterval` de 10 segundos
- Limpia el interval al desmontar el componente
- Si el backend no responde → muestra el último dato conocido con indicador "Sin conexión"

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/cola/asignar` | Asignar línea a un turno (llamado desde kiosk y caja) | Interno |
| GET | `/cola/activa` | Lista de ColaItems activos para el display | Público |
| GET | `/cola/capacidad` | Capacidad disponible ahora por línea | Público |
| PATCH | `/cola/:id/estado` | Actualizar estado de un ítem (llamado desde panel técnico) | Técnico |
| DELETE | `/cola/:id` | Sacar un ítem de la cola (override del Director) | Director |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Todas las líneas llenas | `POST /cola/asignar` devuelve 409. Kiosk muestra "No hay lugar". |
| Una línea se desactiva a mitad del día | Los ítems ya asignados se quedan. No se asignan nuevos a esa línea. |
| Técnico termina la revisión antes de lo esperado | Capacidad se libera, nueva asignación puede entrar |
| Override del Director: mover vehículo de línea | Director borra el ColaItem actual y crea uno nuevo en la línea destino. Queda en OverrideLog. |
