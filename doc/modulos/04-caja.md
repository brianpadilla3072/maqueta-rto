# Módulo 4 — Panel de caja

**Ruta:** `/caja`
**Usuario:** Cajera (requiere login, rol `CAJERA` o `DIRECTOR`)
**Fase:** 1 — MVP

---

## Descripción

Panel de trabajo de la cajera. Busca vehículos por patente, ve la ficha pre-cargada desde Marino, registra cobros y valida comprobantes de transferencia. En Fase 1, la cajera sigue facturando en Marino por separado — Dynnamo solo registra el cobro internamente.

---

## Layout del panel

```
┌─────────────────────────────────────────────────────┐
│  [Buscar patente: _________] [Buscar]               │
├─────────────────────────────────────────────────────┤
│  FICHA DEL VEHÍCULO              COBRO              │
│  ─────────────────               ─────              │
│  Patente: ABC 123                Monto: $12.000      │
│  Titular: Juan Pérez             Medio de pago:      │
│  CUIT: 20-12345678-9             ○ Efectivo          │
│  Cond. IVA: Consumidor final     ○ Posnet             │
│  Tipo: Carga común               ○ Transferencia     │
│  Tipo turno: NUEVO               ──────────────────  │
│  Estado turno: EN_ESPERA         [Registrar cobro]   │
│                                                     │
│  [Editar datos]                                     │
├─────────────────────────────────────────────────────┤
│  TRANSFERENCIAS PENDIENTES                          │
│  ABC123 — $12.000 — [Ver comprobante] [✓] [✗]      │
│  DEF456 — $10.000 — [Ver comprobante] [✓] [✗]      │
└─────────────────────────────────────────────────────┘
```

---

## Flujo de búsqueda y cobro

### 1. Búsqueda por patente
- Input con teclado y botón "Buscar"
- Endpoint: `GET /caja/patente/:patente`
- El backend:
  1. Busca el turno activo de hoy para esa patente en Dynnamo
  2. Consulta Marino para datos de la ficha (`MarinoService.getClienteByPatente`)
  3. Combina ambos y devuelve la ficha completa

### 2. Ficha del vehículo

Muestra los datos pre-cargados de Marino. Los campos editables son:

| Campo | Editable | Cuándo |
|---|---|---|
| Titular | SÍ | Si el cliente informa cambio de titular |
| CUIT | SÍ | Si cambió el responsable de pago |
| Condición IVA | SÍ | Si el cliente cambió de categoría |
| Tipo de carga | SÍ | Si el cliente informa que dejó de hacer carga peligrosa |

Al editar, los nuevos datos se guardan en la tabla `Vehiculo` de Dynnamo (no se escribe en Marino en Fase 1).

**Alerta de titular diferente:**
Si el turno tiene el flag `titularDiferente: true` (detectado en el kiosk), se muestra un banner:
> ⚠️ El titular de la cédula verde difiere del registrado. Verificar con el cliente.

### 3. Registro de cobro

- El monto se calcula automáticamente desde `ConfigTaller.precios` según el tipo de vehículo y carga
- La cajera selecciona el medio de pago: **Efectivo**, **Posnet** o **Transferencia**
- Al presionar "Registrar cobro":
  - `POST /cobro` con `{ turnoId, monto, medioPago }`
  - Backend crea el `Cobro`
  - Si es Efectivo o Posnet → estado `PAGADO` directo
  - Si es Transferencia → estado `PENDIENTE_VALIDACION` (la cajera adjunta o aprueba luego)
  - Turno pasa a estado `CONFIRMADO`
  - Motor de cola asigna línea automáticamente → ColaItem creado

### 4. Ticket interno

Al registrar el cobro, el sistema genera un **PDF simple** (no es factura AFIP):
- Nombre/empresa del cliente
- Patente
- Tipo de vehículo y carga
- Monto cobrado
- Medio de pago
- Fecha y hora
- Número de cobro (ID)

La cajera factura en Marino como siempre. El ticket de Dynnamo es solo para el registro interno.

---

## Sección: Transferencias pendientes

Lista de cobros con estado `PENDIENTE_VALIDACION` del día:

- Muestra: patente, monto, hora del cobro
- Botón "Ver comprobante" → abre imagen/PDF del comprobante adjunto (si lo subió el cliente en Fase 2)
- En Fase 1: el cliente muestra el comprobante en el celular → la cajera lo aprueba manualmente
- Botón ✓ → `PATCH /cobro/:id/estado` con `{ estado: "PAGADO" }`
- Botón ✗ → `PATCH /cobro/:id/estado` con `{ estado: "RECHAZADO" }` → notifica al cliente (Fase 2)

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/caja/patente/:patente` | Ficha completa del vehículo + turno activo | Cajera |
| POST | `/cobro` | Registrar cobro | Cajera |
| PATCH | `/cobro/:id/estado` | Aprobar / rechazar transferencia | Cajera |
| GET | `/cobro/pendientes` | Lista de transferencias pendientes del día | Cajera |
| GET | `/cobro/:id/ticket` | Generar PDF del ticket interno | Cajera |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Patente sin turno activo | La cajera puede crear un turno walk-in desde la vista de caja (mismo flujo que Flujo B) |
| Marino no responde | La ficha carga vacía. La cajera completa los datos manualmente. |
| Cobro duplicado (mismo turno) | Backend devuelve 409. "Este turno ya tiene un cobro registrado." |
| Monto modificado manualmente | Solo el Director puede sobreescribir el monto calculado (queda en OverrideLog) |
