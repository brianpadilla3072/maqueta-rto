# Módulo 1 — Turnero (portal de reserva online)

**Ruta:** `/turno/nuevo`
**Usuario:** Cliente (público, sin login)
**Fase:** 1 — MVP

**Diagrama completo:** [diagramas/flujo-turnero.md](../diagramas/flujo-turnero.md)

---

## Descripción

Portal web donde el cliente reserva su turno de revisión técnica. Es el primer punto de contacto digital con el sistema. Aplica todo el árbol de decisión y la matriz de vigencias antes de mostrar el calendario.

---

## Flujo de pantallas

```
Paso 1: Ingreso de patente
        │
        ▼
Paso 2: Datos del vehículo (pre-cargados o manuales)
        │
        ▼
Paso 3: Árbol de decisión (Hard Stops + advertencias)
        │
        ▼
Paso 4: Calendario de disponibilidad
        │
        ▼
Paso 5: Confirmación + QR
```

---

## Paso 1 — Ingreso de patente

- Input de texto con formato de patente argentina (AAA123 o AA123AA)
- Validación de formato con Zod antes de enviar
- Al enviar: llama al endpoint `GET /turno/patente/:patente`

**Respuesta del endpoint:**
- Si hay historial en Marino → devuelve datos del vehículo y última revisión
- Si no hay historial → devuelve vacío → el cliente carga los datos manualmente
- Si hay condicional pendiente → devuelve el condicional con días transcurridos

---

## Paso 2 — Datos del vehículo

Formulario con los campos del vehículo, pre-cargados si Marino los tiene:

| Campo | Fuente | Editable |
|---|---|---|
| Titular | Marino | SÍ (si cambió) |
| CUIT | Marino | SÍ |
| Condición IVA | Marino | SÍ |
| Tipo de vehículo | Marino / manual | SÍ |
| Año de fabricación | Marino / manual | SÍ |
| Jurisdicción | Cédula verde / manual | SÍ |
| ¿Hace carga peligrosa? | Manual (pregunta explícita) | SÍ — obligatorio |

El componente usa `Mantine TextInput`, `Select`, `NumberInput`, `Checkbox`.

---

## Paso 3 — Árbol de decisión

El motor de reglas corre en el **backend** (NestJS service `ReglasService`). El frontend solo muestra el resultado.

**Si hay Hard Stop:**
- Muestra pantalla de rechazo con el motivo específico
- No permite continuar
- Ofrece link de contacto con el taller

**Si hay advertencias:**
- Muestra cada advertencia como checkbox obligatorio (Mantine `Checkbox`)
- El botón "Continuar" queda deshabilitado hasta que todos estén marcados
- Los checkboxes aceptados se envían al backend junto con la confirmación

**Si todo OK:**
- Muestra resumen: tipo de vehículo, vigencia calculada, precio

---

## Paso 4 — Calendario de disponibilidad

- Componente `Mantine DatePicker` o similar mostrando los próximos 30 días
- Días bloqueados: feriados, días no hábiles, días completos (sin capacidad)
- Al seleccionar un día: muestra los horarios disponibles (slots de 15 o 20 minutos)
- Slots calculados según la capacidad por línea configurada en `ConfigTaller`

**Endpoint:** `GET /turno/disponibilidad?fecha=2026-04-10`
- Devuelve slots disponibles para esa fecha
- Un slot está disponible si `ocupados < capacidadTotal` (con turno + sin turno)

---

## Paso 5 — Confirmación

Al confirmar:
1. `POST /turno` con todos los datos: patente, fecha, hora, advertencias aceptadas
2. Backend crea el `Turno` (estado: `RESERVADO`)
3. Genera `qrCode` único (UUID o hash)
4. Devuelve el turno creado

Frontend:
- Muestra pantalla de confirmación con el QR generado (`qrcode` npm package)
- Botón para descargar el QR como imagen
- En Fase 2: también envía QR por WhatsApp/mail

---

## Estados del Turno

```
RESERVADO    → Turno creado, sin confirmar pago (Fase 1: queda en este estado hasta el kiosk)
CONFIRMADO   → Pago validado o cuenta corriente verificada
EN_ESPERA    → Cliente hizo check-in en el kiosk, esperando en la cola
EN_LINEA     → Ingresó físicamente a la línea (técnico lo marcó)
FINALIZADO   → Revisión terminada (Aprobado)
CONDICIONAL  → Revisión terminada con observaciones
RECHAZADO    → Revisión terminada con rechazo
CANCELADO    → Turno cancelado antes del check-in
```

---

## Endpoints del módulo

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/turno/patente/:patente` | Datos del vehículo + historial Marino + condicional | Público |
| GET | `/turno/disponibilidad` | Slots disponibles por fecha | Público |
| POST | `/turno` | Crear turno nuevo | Público |
| GET | `/turno/:id` | Datos de un turno específico | Público (por qrCode) |

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Marino no responde | El formulario carga vacío. El cliente ingresa todo manual. |
| Patente sin historial previo | Igual que Marino sin responder: carga manual |
| Intento de doble turno (misma patente, mismo día) | Backend devuelve 409. Frontend muestra: "Ya tenés un turno para hoy" con el QR existente |
| Día completo al intentar confirmar | Backend devuelve 409. Frontend vuelve al calendario y bloquea ese día |
| Hard Stop después de cargar todo | Muestra rechazo claro. Los datos cargados se pierden (el cliente debe empezar de nuevo si corrige la situación) |
