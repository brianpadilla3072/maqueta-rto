# Integración PayWay — Pasarela de Pagos

**Fase:** 2 — Pagos online
**Estimación:** 30h
**Documentación oficial:** https://developers.payway.com.ar
**GitHub:** https://github.com/payway-ar
**Soporte:** soporte@payway.com.ar

---

## Descripción

PayWay es la pasarela de pagos definida para el proyecto. Permite cobrar con tarjeta de crédito y débito directamente desde el portal de turnos. El flujo es de dos pasos: el front-end tokeniza los datos sensibles de la tarjeta (nunca llegan al servidor propio), y el back-end ejecuta el cobro usando el token.

---

## Flujo de integración

```
[Cliente — front-end Next.js]
  Ingresa datos de tarjeta
        │
        ▼
  JS SDK PayWay (public API Key)
  Tokeniza PAN + vencimiento + CVV + titular
        │
        ▼ token de pago
[Backend NestJS]
  POST /pago con { token, monto, cuotas, turnoId }
        │
        ▼
  Node.js SDK PayWay (private API Key)
  Ejecuta el cobro
        │
        ├── APROBADO → turno.pagoEstado = PAGADO
        └── RECHAZADO → notifica al cliente
```

---

## Credenciales necesarias

| Clave | Dónde se usa | Cómo obtener |
|---|---|---|
| `PUBLIC_API_KEY` | Front-end (JS SDK) | Mi Payway → Configuración → Mis ApiKeys |
| `PRIVATE_API_KEY` | Back-end (NestJS) | Mi Payway → Configuración → Mis ApiKeys |

Las credenciales las provee el equipo de soporte PayWay (soporte@payway.com.ar) si no se tiene cuenta, o se obtienen desde el portal si ya hay cuenta activa.

---

## Webhooks

PayWay notifica al back-end cuando el estado de un pago cambia (aprobado, rechazado, pendiente). El endpoint a configurar en el portal de PayWay:

```
POST /pagos/webhook/payway
```

**Acciones según evento:**

| Evento | Acción en Dynnamo |
|---|---|
| `APPROVED` | `turno.pagoEstado = PAGADO` → motor de cola asigna línea |
| `REJECTED` | `turno.pagoEstado = SIN_PAGO` → notifica al cliente |
| `PENDING` | `turno.pagoEstado = PENDIENTE_VALIDACION` → queda en cola de revisión |

---

## Impacto en el schema de BD

El enum `medioPago` del modelo `Cobro` suma el valor `PAYWAY` en Fase 2:

```prisma
enum MedioPago {
  EFECTIVO
  POSNET
  TRANSFERENCIA
  PAYWAY  // Fase 2
}
```

---

## Módulos de NestJS involucrados

| Módulo | Archivo | Tarea |
|---|---|---|
| `PagoModule` | `src/pago/pago.service.ts` | Ejecutar cobro con SDK Node.js |
| `PagoModule` | `src/pago/pago.controller.ts` | Endpoint webhook `/pagos/webhook/payway` |
| `TurnoModule` | `src/turno/turno.service.ts` | Actualizar `pagoEstado` al recibir webhook |
| `ColaModule` | `src/cola/cola.service.ts` | Asignar línea cuando pago queda `PAGADO` |

---

## Variables de entorno necesarias

```env
PAYWAY_PUBLIC_KEY=...
PAYWAY_PRIVATE_KEY=...
PAYWAY_WEBHOOK_SECRET=...   # para validar firma del webhook
```

---

## Notas

- Los datos de tarjeta **nunca tocan el servidor propio** — la tokenización es 100% client-side con el JS SDK de PayWay.
- En Fase 1 no hay pago online: el turno queda en estado `RESERVADO` y el cliente paga en caja. El módulo PayWay es exclusivo de Fase 2.
- Para transferencias bancarias (también Fase 2): el cliente sube el comprobante y la cajera lo aprueba manualmente desde el panel de caja (flujo ya documentado en [modulos/04-caja.md](../modulos/04-caja.md)).
