# Módulo 2 — Kiosk de entrada

**Ruta:** `/kiosk`
**Usuario:** Cliente (público, sin login) — tablet en la entrada del taller
**Fase:** 1 — MVP

---

## Descripción

Tablet en la entrada del taller. El cliente interactúa solo, sin cajera. Escanea el QR de su turno o de su cédula verde (o ingresa la patente manualmente), y el sistema le indica a qué línea dirigirse o si debe pasar por caja.

---

## Diseño de la interfaz

- **PWA fullscreen** — sin barra de navegación del browser
- Tipografía grande (mínimo 24px en elementos clave), pensada para uso parado
- Teclado virtual Mantine para ingreso de patente (no depende del teclado del sistema)
- Fondo oscuro / alto contraste para visibilidad en el galpón
- Respuesta máxima de 2 segundos desde el input hasta la pantalla de resultado

---

## Input: cómo ingresa el cliente

El kiosk acepta dos modos, detectados automáticamente:

| Modo | Descripción |
|---|---|
| **QR del turno** | El cliente muestra el QR recibido al reservar. La cámara lo lee y extrae el `qrCode`. |
| **QR de la cédula verde** | La cédula verde tiene QR con datos del titular y vehículo. El sistema extrae la patente. |
| **Patente manual** | Input con teclado virtual. El cliente tipea la patente si no tiene QR. |

La cámara queda activa por defecto. Si el cliente prefiere tipear, puede tocar el botón "Ingresar manualmente".

---

## Lógica de decisión (backend)

Al recibir la patente o el `qrCode`, el backend ejecuta:

```
1. ¿Tiene turno para hoy?
   ├── SÍ → ver paso 2
   └── NO → ver Flujo sin turno

2. ¿El turno está en estado válido para check-in?
   (RESERVADO o CONFIRMADO)
   ├── SÍ → ver paso 3
   └── NO (CANCELADO, ya FINALIZADO, etc.) → error con mensaje claro

3. [Fase 2] ¿El turno está pagado?
   ├── PAGADO → asignar línea directamente
   └── SIN_PAGO / PENDIENTE → enviar a caja primero

4. Verificación de cédula (si se escaneó):
   ¿El titular de la cédula coincide con el titular del turno?
   ├── SÍ → continuar
   └── NO → alerta a cajera (el cliente puede continuar, pero queda marcado)
```

---

## Los 3 flujos de salida

### Flujo 1: Turno + pago OK (o Fase 1 sin pago)
- Asigna línea (motor de cola)
- Turno pasa a `EN_ESPERA`
- ColaItem creado con prioridad `CON_TURNO`

**Pantalla:**
```
┌──────────────────────────────┐
│                              │
│   ✓  ABC 123                 │
│                              │
│   DIRÍJASE A LA              │
│   ████ LÍNEA 2 ████          │
│                              │
│   (indicador verde)          │
│                              │
└──────────────────────────────┘
```

### Flujo 2: Turno sin pago (Fase 2)
- No asigna línea todavía
- El cliente debe ir a caja

**Pantalla:**
```
┌──────────────────────────────┐
│                              │
│   ABC 123                    │
│                              │
│   Diríjase a CAJA            │
│   para completar el pago     │
│                              │
│   Su turno está reservado    │
│                              │
└──────────────────────────────┘
```

### Flujo 3: Sin turno
**Sub-caso A — Hay capacidad:**
```
┌──────────────────────────────┐
│                              │
│   ABC 123                    │
│   No tiene turno agendado    │
│                              │
│   Hay lugar disponible       │
│   Diríjase a CAJA            │
│                              │
└──────────────────────────────┘
```

**Sub-caso B — No hay capacidad:**
```
┌──────────────────────────────┐
│                              │
│   ABC 123                    │
│   No hay turnos disponibles  │
│                              │
│   Espera estimada: 35 min    │
│   Próximo turno: 14:30       │
│                              │
│   [Reservar turno online]    │
└──────────────────────────────┘
```

---

## Verificación de titular (cédula verde)

Si el cliente escanea la cédula verde (no el QR del turno):
1. Sistema extrae patente y titular de la cédula
2. Compara titular con el registrado en el turno
3. Si hay diferencia:
   - El cliente puede continuar (no se bloquea)
   - Se crea un flag en el turno: `titularDiferente: true`
   - En `/caja`, la cajera ve una alerta: "⚠️ Titular de cédula verde difiere del turno"

---

## Auto-reset

Después de 30 segundos sin actividad, el kiosk vuelve a la pantalla inicial automáticamente. Esto evita que una sesión bloquee a los siguientes clientes.

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/kiosk/checkin` | Check-in por QR o patente. Devuelve resultado con línea asignada | Público |
| GET | `/kiosk/disponibilidad` | ¿Hay capacidad ahora? (para mostrar al cliente sin turno) | Público |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| QR inválido o expirado | "No reconocemos este código. Ingrese la patente manualmente." |
| Patente con turno para otro día | "Su turno es el [fecha]. Hoy no tiene turno agendado." → muestra Flujo 3 |
| Patente con turno ya finalizado hoy | "Ya completó su revisión técnica hoy." |
| Líneas llenas al intentar asignar | Sistema intenta la siguiente línea disponible. Si todas llenas → Flujo 3 Sub-caso B |
| Sin conexión al backend | Pantalla de error con instrucción de dirigirse a caja |
