# Flujos principales (User Journeys)

Los 4 flujos cubren el 95% de los casos operativos del taller.

---

## Flujo A — Cliente con turno (flujo ideal)

**Actor:** Cliente individual o corporativo que sacó turno previamente.
**Pantallas involucradas:** `/turno/nuevo` (en casa) → `/kiosk` → `/display` → `/tecnico`

```
[DESDE CASA]
1. Cliente ingresa patente en /turno/nuevo
2. Sistema consulta Marino → muestra datos del historial previo
3. Sistema aplica árbol de decisión:
   a. ¿Condicional pendiente? → NO, continúa
   b. ¿Hard Stop? → NO, continúa
   c. Pregunta: ¿sigue haciendo carga peligrosa?
   d. Calcula vigencia según matriz
   e. Muestra advertencias → cliente acepta checkboxes
4. Cliente selecciona día y hora en el calendario
5. Sistema crea Turno (estado: RESERVADO) en DB
6. Sistema genera QR único → muestra en pantalla
   (En Fase 1: no hay pago online. El turno queda RESERVADO sin pago.)

[EN EL TALLER — Entrada]
7. Cliente llega, abre el QR en el celular
8. En el kiosk /kiosk: escanea QR del turno
9. Sistema detecta: tiene turno para hoy ✓
10. En Fase 1: no hay validación de pago → pasa directo
    (En Fase 2: si pagó online → pasa directo / si no → va a caja)
11. Sistema asigna línea (motor de cola)
    → Turno pasa a estado EN_ESPERA
    → ColaItem creado con prioridad CON_TURNO
12. Pantalla del kiosk muestra: "LÍNEA 2 — Ingrese" (grande, con indicador de color)

[EN EL GALPÓN]
13. Display /display muestra la patente con "LÍNEA 2"
14. Técnico en /tecnico ve el vehículo en su cola
15. Técnico presiona "Ingresó a línea" → estado ColaItem: INGRESO
16. Técnico realiza la revisión → presiona "En revisión" → timestamp registrado
17. Técnico determina resultado:
    → "Aprobado" → ColaItem: FINALIZADO / Turno: FINALIZADO
    → "Condicional" → ColaItem: FINALIZADO / Turno: CONDICIONAL
    → "Rechazado" → ColaItem: FINALIZADO / Turno: RECHAZADO
18. Capacidad de la línea se libera automáticamente
```

---

## Flujo B — Cliente sin turno ("serialero")

**Actor:** Cliente que llega directamente al taller sin haber reservado.
**Pantallas involucradas:** `/kiosk` → `/caja` → `/display` → `/tecnico`

```
[EN EL TALLER — Entrada]
1. Cliente llega sin turno
2. En el kiosk /kiosk: ingresa patente manualmente (teclado virtual)
3. Sistema detecta: no tiene turno para hoy
4. Sistema consulta capacidad disponible en tiempo real:

   ¿Hay lugar en alguna línea ahora?
   ├── SÍ → "Diríjase a caja para registrarse"
   │         Sistema reserva el slot (bloqueo temporal de 10 min)
   └── NO → "No hay turnos disponibles ahora"
             "Espera estimada: X minutos"
             "Próximo turno disponible: HH:MM"
             (Cliente puede esperar o volver)

[EN CAJA — si hay lugar]
5. Cajera busca patente en /caja
6. Sistema trae datos de Marino (si los tiene) → pre-carga ficha
7. Cajera confirma/edita datos
8. Cajera registra cobro: efectivo o posnet
   → Cobro creado en DB (estado: PAGADO)
   → Turno creado (estado: CONFIRMADO, tipo: NUEVO)
9. Sistema asigna línea (motor de cola)
   → ColaItem creado con prioridad SIN_TURNO (cola de espera)
10. Display /display muestra la patente con la línea asignada

[EN EL GALPÓN]
11. Igual que Flujo A pasos 14-18
```

---

## Flujo C — Empresa con flota (cuenta corriente)

**Actor:** Chofer de empresa (Transener, Cargill, etc.) con turno corporativo.
**Pantallas involucradas:** `/turno/nuevo` (empresa) → `/kiosk` → `/caja` (verificación rápida) → `/display`

```
[EMPRESA — desde oficina]
1. Responsable de flota ingresa patente del camión en /turno/nuevo
2. Sistema detecta que el cliente tiene cuenta corriente activa
3. Flujo rápido: sin solicitud de pago
   → Reserva el turno
   → Genera QR para el chofer
   → (En Fase 2: genera factura anticipada en PDF para que administración apruebe)

[CHOFER EN EL TALLER]
4. Llega con el QR (recibido por WhatsApp o impreso)
5. Kiosk detecta: turno ✓ / cuenta corriente ✓
6. En Fase 1 (sin pago online): sistema lo envía a caja igual para verificación rápida

[EN CAJA]
7. Cajera busca por patente → ve que es cuenta corriente
8. Registra la deuda (no cobra en el momento)
   → Cobro creado (estado: PENDIENTE — cuenta corriente)
9. Asigna línea con prioridad CON_TURNO

[EN EL GALPÓN]
10. Igual que Flujo A pasos 13-18
```

---

## Flujo D — Vehículo con condicional vencido

**Actor:** Cliente cuyo vehículo quedó "condicional" en la revisión anterior.
Hay dos sub-casos según el tiempo transcurrido.

### Sub-caso D1: Condicional reciente (< 30 días)

```
[CLIENTE]
1. Ingresa patente en /turno/nuevo
2. Sistema consulta Marino → detecta condicional pendiente
3. Verifica días transcurridos: < 30 días
4. Asigna turno directo de reverificación (tipo: REVERIFICACION)
   → Sin árbol de decisión completo
   → Sin cargo (es una reverificación, no paga)
5. Cliente recibe QR del turno
6. Al llegar: flujo normal (kiosk → línea → técnico)
```

### Sub-caso D2: Condicional vencido (> 30 días)

```
[CLIENTE]
1. Ingresa patente en /turno/nuevo
2. Sistema detecta condicional > 30 días
3. Portal bloquea: "Comuníquese con administración"
4. Sistema crea registro en CondicionalVencido (estado: BLOQUEADO)

[ADMINISTRACIÓN]
5. Cajera/Director ve el caso en /admin → sección "Condicionales vencidos"
6. Verifica el caso (puede consultar Marino para contexto)
7. Presiona "Forzar Turno"
8. Sistema:
   a. Actualiza CondicionalVencido (estado: FORZADO)
   b. Crea Turno nuevo para el siguiente día hábil disponible
   c. Registra en OverrideLog (quién forzó y por qué)
   (En Fase 2: envía WhatsApp al cliente con el turno generado)

[CLIENTE — después]
9. Puede presentarse al taller con ese turno
10. Al llegar: flujo normal (kiosk → caja → línea → técnico)
11. Paga como turno nuevo (cobro completo)
```

---

## Tabla de estados por flujo

| Flujo | Estado inicial Turno | Estado final Turno | Prioridad Cola |
|---|---|---|---|
| A — Con turno | RESERVADO → CONFIRMADO | FINALIZADO / CONDICIONAL / RECHAZADO | CON_TURNO |
| B — Sin turno | (creado en caja) CONFIRMADO | FINALIZADO / CONDICIONAL / RECHAZADO | SIN_TURNO |
| C — Corpo | RESERVADO | FINALIZADO / CONDICIONAL / RECHAZADO | CON_TURNO |
| D1 — Cond. reciente | RESERVADO (REVERIFICACION) | FINALIZADO / CONDICIONAL | CON_TURNO |
| D2 — Cond. vencido | Creado por admin CONFIRMADO | FINALIZADO / CONDICIONAL | CON_TURNO |
