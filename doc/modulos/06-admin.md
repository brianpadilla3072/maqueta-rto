# Módulo 6 — Dashboard de Administración

**Ruta:** `/admin`
**Usuario:** Cajera y Director (rol `CAJERA` o `DIRECTOR`)
**Fase:** 1 — MVP

---

## Descripción

Panel operativo para la gestión diaria del taller. Centraliza las tareas administrativas que antes se hacían manualmente: gestionar condicionales vencidos, validar transferencias, hacer el cierre de caja y monitorear las líneas.

---

## Secciones del dashboard

El panel tiene 4 secciones navegables (tabs o sidebar):

1. **Condicionales vencidos** — gestionar vehículos bloqueados
2. **Pagos pendientes** — validar transferencias
3. **Cierre de caja** — resumen financiero del día
4. **Vehículos en línea** — monitoreo en tiempo real

---

## Sección 1 — Condicionales vencidos

Muestra todos los vehículos con condicional > 30 días que están bloqueados en el portal.

**Tabla:**

| Patente | Titular | Fecha condicional | Días transcurridos | Acción |
|---|---|---|---|---|
| ABC 123 | Juan Pérez | 01/03/2026 | 35 días | [Forzar Turno] |
| DEF 456 | Transener SA | 15/02/2026 | 49 días | [Forzar Turno] |

**Acción "Forzar Turno":**
1. Modal de confirmación: "¿Generar turno para ABC123 para mañana?"
2. Al confirmar:
   - `POST /admin/forzar-turno/:vehiculoId`
   - Backend crea un `Turno` para el siguiente día hábil disponible (primer slot libre)
   - Actualiza `CondicionalVencido.estado` a `FORZADO`
   - Registra en `OverrideLog` quién lo forzó y cuándo
   - (Fase 2: envía WhatsApp al cliente con el turno generado)
3. El registro sale de la lista de pendientes

---

## Sección 2 — Pagos pendientes de validación

Lista de cobros con estado `PENDIENTE_VALIDACION` del día actual.

**Tabla:**

| Patente | Titular | Monto | Hora | Comprobante | Acciones |
|---|---|---|---|---|---|
| ABC 123 | Juan Pérez | $12.000 | 09:45 | [Ver] | [✓ Aprobar] [✗ Rechazar] |
| GHI 789 | Rutas SA | $15.000 | 10:12 | [Ver] | [✓ Aprobar] [✗ Rechazar] |

**Aprobar:**
- `PATCH /cobro/:id/estado` → `{ estado: "PAGADO" }`
- El turno pasa a `CONFIRMADO`
- Si el turno tenía prioridad `CON_TURNO` y ya está en el kiosk: motor de cola asigna línea

**Rechazar:**
- `PATCH /cobro/:id/estado` → `{ estado: "RECHAZADO" }`
- El turno vuelve a estado `RESERVADO`
- (Fase 2: notificación al cliente)

**Ver comprobante:**
- En Fase 1: el cliente muestra el comprobante físico; la cajera aprueba directamente
- En Fase 2: el cliente adjunta imagen al reservar; se abre en modal

---

## Sección 3 — Cierre de caja

Resumen financiero del día. Accesible para Cajera y Director.

**Cuadro resumen:**
```
CIERRE DE CAJA — Viernes 5 de abril de 2026
─────────────────────────────────────────────
Efectivo:      $ 85.000    (7 cobros)
Posnet:        $ 48.000    (4 cobros)
Transferencia: $ 60.000    (5 cobros)
─────────────────────────────────────────────
TOTAL:         $193.000   (16 cobros)

Pendientes de validación: 2 cobros ($27.000)
─────────────────────────────────────────────
Arqueo de efectivo: [_________] ← la cajera ingresa el efectivo real contado

[Guardar arqueo]  [Exportar PDF]
```

- El total se calcula automáticamente desde los cobros del día con estado `PAGADO`
- El campo de arqueo permite ingresar el efectivo real para detectar diferencias
- "Exportar PDF" genera el reporte del día para el Director

---

## Sección 4 — Vehículos en línea

Vista en tiempo real de los ColaItems activos. Auto-refresh cada 15 segundos.

**Tabla:**

| Línea | Patente | Estado | Tiempo en línea | Técnico |
|---|---|---|---|---|
| Línea 1 | ABC 123 | EN REVISIÓN | 00:15:32 | Carlos |
| Línea 1 | DEF 456 | EN ESPERA | — | — |
| Línea 2 | GHI 789 | EN ESPERA | — | — |

- El Director ve esta vista y puede hacer override desde aquí (botón visible solo para `DIRECTOR`)
- La cajera solo puede ver, no modificar

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/admin/condicionales` | Lista de condicionales vencidos | Cajera |
| POST | `/admin/forzar-turno/:vehiculoId` | Forzar turno para vehículo bloqueado | Cajera |
| GET | `/cobro/pendientes` | Transferencias pendientes de hoy | Cajera |
| PATCH | `/cobro/:id/estado` | Aprobar o rechazar | Cajera |
| GET | `/admin/cierre-caja` | Resumen financiero del día | Cajera |
| PATCH | `/admin/arqueo` | Guardar arqueo de efectivo | Cajera |
| GET | `/cola/activa` | Vehículos en línea ahora | Cajera |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| No hay condicionales vencidos | Sección muestra: "No hay condicionales pendientes hoy." |
| Forzar turno cuando el día siguiente está lleno | Sistema busca el primer día hábil con capacidad disponible (puede ser más adelante) |
| Aprobar transferencia de un turno ya vencido | Backend valida que el turno siga activo. Si ya finalizó, no permite aprobar. |
| Cajera intenta hacer override | Backend devuelve 403. El botón de override no aparece en el frontend para este rol. |
