# Reglas de negocio

Este archivo es la fuente de verdad para programar el motor de decisión del turnero. Todas las validaciones, rechazos y cálculos de vigencia están definidos aquí.

---

## 1. Hard Stops — Rechazo automático

Si alguna de estas condiciones se cumple, el sistema **rechaza el turno** y muestra el motivo. No hay excepción manual desde el portal.

### 1.1 Por jurisdicción
- Vehículos tipo **N1** (Sedán / Auto / SUV) radicados en **Bs. As., Mendoza o CABA** → rechazados.
- Este taller solo atiende N1 de otras jurisdicciones (o los clasifica como CARGA si aplica — ver punto 3.4).
- La radicación se determina por la cédula verde o por el historial del sistema nacional RTO.

### 1.2 Por tipo de vehículo de pasajeros (M1 / M2 / M3)
Rechazo si se cumple **cualquiera** de estas condiciones:
- Antigüedad del vehículo **mayor a 13 años**
- No tiene **tacógrafo** instalado
- La cédula verde **no indica uso para pasajeros**

### 1.3 Por documentación
- La **Cédula Verde** es obligatoria. Sin ella no se puede completar la reserva.

---

## 2. Checkboxes de advertencia obligatorios

Antes de confirmar el turno, el cliente debe marcar explícitamente estas advertencias. No puede continuar sin hacerlo.

| Advertencia | Cuándo aplica |
|---|---|
| "Debo retirar los vidrios polarizados antes de la inspección" | Siempre que haya vidrios polarizados declarados |
| "El vehículo no cuenta con bandas reflectivas reglamentarias" | Cuando se detecta que faltan |
| "Entiendo que la vigencia de mi RTO será de 4 meses" | Cuando la matriz determina vigencia corta |

Estos checkboxes deben quedar registrados en la DB con timestamp (para auditoría).

---

## 3. Matriz de vigencia — Cálculo dinámico

La vigencia del certificado varía según el tipo de vehículo y su antigüedad. El sistema la calcula automáticamente al confirmar el turno.

### 3.1 Carga peligrosa
| Antigüedad del vehículo | Vigencia |
|---|---|
| Menos de 10 años | 1 año |
| 10 años o más | 4 meses |

### 3.2 Uso particular
| Antigüedad del vehículo | Vigencia |
|---|---|
| Menos de 7 años | 2 años |
| 7 años o más | 1 año |

### 3.3 Pasajeros (M1 / M2 / M3)
| Condición | Vigencia |
|---|---|
| 0 km (primera vez) | Inicial (sin vencimiento fijo) |
| Menos de 10 años | 6 meses |
| 10 años o más | 4 meses |

### 3.4 Pick-up N1 en Bs. As. — caso especial
- Un **Pick-up N1 radicado en Bs. As.** se clasifica obligatoriamente como **CARGA**.
- Esto afecta tanto la **tarifa** (precio de carga) como la **vigencia** (se aplica la matriz de carga peligrosa o uso particular según corresponda).
- El sistema debe detectar este caso y forzar la clasificación, mostrando una advertencia al cliente.

---

## 4. Pregunta crítica: cambio de tipo de carga

Al reservar turno, el sistema siempre debe preguntar:

> **¿El vehículo sigue realizando carga peligrosa?**

Esto es obligatorio porque:
- Si el vehículo hacía carga peligrosa y ya no la hace, cambia la vigencia y la tarifa
- Si el taller emite el certificado con el tipo de carga incorrecto, el documento queda inválido
- El historial del sistema nacional RTO puede mostrar el tipo anterior pero no el actual

La respuesta del cliente queda registrada en el turno.

---

## 5. Validación de cuenta corriente (clientes corporativos)

Para clientes con cuenta corriente (Fase 2), la validación ocurre **antes** de solicitar datos de facturación:

```
Cliente ingresa patente
        │
        ▼
¿Tiene cuenta corriente activa? → SÍ → flujo rápido (sin pago inmediato)
        │
        NO
        ▼
Solicitar datos de facturación y medio de pago
```

Si la cuenta corriente está **bloqueada o vencida**, el sistema lo notifica y deriva a administración.

---

## 6. Manejo de condicionales

Un vehículo **condicional** es uno que quedó con observaciones en la revisión anterior y debe volver a revisión.

### 6.1 Flujo según el plazo desde el condicional

```
Cliente intenta sacar turno
        │
        ▼
Sistema consulta Marino → ¿tiene condicional pendiente?
        │
       SÍ
        │
        ▼
¿Cuántos días pasaron desde el condicional?
        │
    < 30 días → Asigna turno directo de reverificación (sin árbol de decisión completo)
        │
    > 30 días → BLOQUEA portal
                Mensaje: "Comuníquese con administración"
                Admin debe usar "Forzar Turno" para blanquear
```

### 6.2 Acción de admin: Forzar Turno
- Solo accesible para Cajera y Director desde el Dashboard Admin
- Al presionar: marca el condicional como blanqueado en la DB de Dynnamo
- Genera automáticamente un turno para el siguiente día hábil disponible
- El cliente puede presentarse con ese turno en el kiosk normalmente

### 6.3 ¿Paga de nuevo un condicional?
- El condicional dentro del plazo (< 30 días): **no paga** (es una reverificación)
- El condicional vencido (> 30 días, forzado por admin): **paga como turno nuevo**
- Esta lógica debe quedar clara en el turno generado (`tipo: REVERIFICACION` vs `tipo: NUEVO`)

---

## 7. Cálculo de antigüedad del vehículo

La antigüedad se calcula desde el **año de fabricación** (que viene en la cédula verde o del historial RTO).

```
antigüedad = año_actual - año_fabricación
```

Si el año de fabricación no está disponible (vehículo sin historial previo), el sistema pide al cliente que lo ingrese manualmente.

---

## 8. Tarifa

El precio se calcula según:
1. **Tipo de vehículo** (carga, particular, pasajeros)
2. **Tipo de carga** (si aplica: peligrosa o común)
3. **Jurisdicción** (puede afectar en algunos casos)

Los precios son configurables por el Director desde `/config`. No están hardcodeados en el código.

---

## Resumen del árbol de decisión del turnero

```
Ingresa patente
    │
    ▼
¿Tiene condicional?
    ├── SÍ, < 30 días → turno de reverificación
    ├── SÍ, > 30 días → bloquear, derivar a admin
    └── NO → continúa

¿Es N1 de Bs.As./Mendoza/CABA?
    ├── SÍ, NO es Pick-up → RECHAZAR
    └── SÍ, es Pick-up en Bs.As. → clasificar como CARGA y continuar

¿Es vehículo de pasajeros?
    ├── Antigüedad > 13 años → RECHAZAR
    ├── Sin tacógrafo → RECHAZAR
    └── Cédula no indica pasajeros → RECHAZAR

¿Sigue haciendo carga peligrosa? → registrar respuesta

Calcular vigencia según matriz
Calcular tarifa según tipo + carga + jurisdicción
Mostrar advertencias → checkboxes obligatorios
Mostrar calendario de disponibilidad
Confirmar turno → generar QR
```
