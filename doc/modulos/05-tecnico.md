# Módulo 5 — Panel del técnico

**Ruta:** `/tecnico`
**Usuario:** Técnico (requiere login, rol `TECNICO`)
**Fase:** 1 — MVP

---

## Descripción

Vista de trabajo del técnico de línea. Muestra únicamente los vehículos asignados a su línea, en el orden que el sistema determinó. El técnico actualiza el estado de cada revisión conforme avanza.

---

## Principio de diseño

El técnico **no puede**:
- Ver otras líneas
- Cambiar el orden de atención
- Saltarse un vehículo

El técnico **solo puede**:
- Ver los ítems de su línea en orden
- Avanzar el estado de cada ítem hacia adelante

Cualquier excepción requiere intervención del Director (override con justificación).

---

## Layout del panel

```
┌──────────────────────────────────────────────────────┐
│  LÍNEA 1 — Técnico: Carlos García      10:42         │
│  Capacidad: 4/hora  |  Activos hoy: 3               │
├──────────────────────────────────────────────────────┤
│  #1  ABC 123                                         │
│      Carga común — Turno: NUEVO                      │
│      Estado: EN REVISIÓN  ⏱ 00:12:35                 │
│      [Aprobado]  [Condicional]  [Rechazado]          │
├──────────────────────────────────────────────────────┤
│  #2  DEF 456                                         │
│      Carga peligrosa — Turno: NUEVO                  │
│      Estado: ESPERANDO                               │
│      [Ingresó a línea]                               │
├──────────────────────────────────────────────────────┤
│  #3  GHI 789                                         │
│      Particular — Turno: REVERIFICACIÓN              │
│      Estado: ESPERANDO                               │
│      (bloqueado hasta que #2 esté en revisión)       │
└──────────────────────────────────────────────────────┘
```

---

## Estados de un ColaItem

```
EN_ESPERA → [técnico presiona "Ingresó a línea"] → INGRESO
INGRESO   → [técnico presiona "En revisión"]     → EN_REVISION
EN_REVISION → [técnico presiona resultado]        → FINALIZADO
```

Las transiciones solo avanzan, nunca retroceden (sin override).

---

## Acciones disponibles por estado

| Estado actual | Botones visibles | Acción |
|---|---|---|
| `EN_ESPERA` | Ingresó a línea | Avanza a INGRESO |
| `INGRESO` | En revisión | Avanza a EN_REVISION, registra timestamp de inicio |
| `EN_REVISION` | Aprobado / Condicional / Rechazado | Cierra el ítem, libera capacidad |

Solo se puede avanzar el **primer ítem en EN_ESPERA** — el segundo ítem solo se puede mover a INGRESO cuando el primero ya está EN_REVISION o FINALIZADO. Esto evita que el técnico haga "cherry-picking".

---

## Registro de tiempos

El sistema registra automáticamente:
- `ColaItem.inicioRevision` → timestamp cuando pasa a `EN_REVISION`
- `ColaItem.finRevision` → timestamp cuando pasa a `FINALIZADO`

Esto permite calcular el **tiempo promedio por revisión** para los reportes del Director.

El cronómetro visible en la UI (`⏱ 00:12:35`) corre en el frontend desde que el ítem entró en `EN_REVISION`.

---

## Override del Director

Si el Director necesita intervenir (saltear un vehículo, cambiar el orden, marcar un resultado diferente):

1. El Director accede a `/tecnico` desde su sesión
2. Ve los mismos ítems pero con botones de override adicionales (visibles solo para `DIRECTOR`)
3. Al presionar override → modal con campo de justificación obligatorio
4. Al confirmar → acción ejecutada + registro en `OverrideLog`

---

## Refresh de datos

La lista de ColaItems se actualiza cada **15 segundos** (polling simple). Si un nuevo vehículo entra a la línea, aparece automáticamente sin que el técnico tenga que recargar la página.

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/cola/linea/:lineaId` | ColaItems activos de la línea del técnico | Técnico |
| PATCH | `/cola/:id/estado` | Avanzar estado de un ítem | Técnico |
| POST | `/cola/:id/override` | Override con justificación (solo Director) | Director |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| La línea se queda sin ítems | Pantalla: "No hay vehículos en cola. Esperando..." |
| Técnico intenta avanzar el ítem #2 sin completar el #1 | Backend devuelve 403. "Debe completar el vehículo en curso primero." |
| Corte de conexión durante revisión | El cronómetro sigue corriendo en el frontend. Al reconectar, el estado se sincroniza. |
| Resultado "Condicional" | El Turno queda en estado `CONDICIONAL`. Se crea registro en `CondicionalVencido` con el plazo de 30 días desde hoy. |
