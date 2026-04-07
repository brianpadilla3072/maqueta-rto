# Schema de base de datos (Prisma)

Base de datos: **PostgreSQL**. ORM: **Prisma**.

---

## Diagrama de relaciones

```
ConfigTaller (1)
    │
    └── (configuración global del taller)

Usuario (N)
    └── OverrideLog (N)

Linea (N)
    ├── Turno (N)
    └── ColaItem (N)

Vehiculo (N)
    ├── Turno (N)
    └── CondicionalVencido (N)

Turno (N)
    ├── ColaItem (1)
    ├── Cobro (1)
    ├── AdvertenciaAceptada (N)
    └── OverrideLog (N)
```

---

## Tablas

### `Vehiculo`
Datos del vehículo. Se crea o actualiza al reservar turno.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `patente` | String | Unique |
| `tipo` | Enum | `CARGA`, `PARTICULAR`, `PASAJEROS`, `PICK_UP` |
| `jurisdiccion` | String | Provincia de radicación |
| `titular` | String | Nombre del titular |
| `cuit` | String | CUIT del titular |
| `condicionIva` | String | `RESPONSABLE_INSCRIPTO`, `CONSUMIDOR_FINAL`, etc. |
| `anioFabricacion` | Int | Para calcular antigüedad |
| `esCargas` | Boolean | Si fue reclasificado como CARGA (Pick-up N1 Bs.As.) |
| `creadoEn` | DateTime | |
| `actualizadoEn` | DateTime | |

---

### `Turno`
Cada reserva de turno. Núcleo del sistema.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `vehiculoId` | String | FK → Vehiculo |
| `lineaId` | String? | FK → Linea (asignada al hacer check-in) |
| `fecha` | DateTime | Fecha y hora del turno |
| `estado` | Enum | Ver estados abajo |
| `tipo` | Enum | `NUEVO`, `REVERIFICACION` |
| `qrCode` | String | Código único para el QR |
| `pagoEstado` | Enum | `SIN_PAGO`, `PENDIENTE_VALIDACION`, `PAGADO` |
| `vigenciaCalculada` | String | Ej: "1 año", "4 meses" |
| `tipoCargas` | Boolean | Si hace carga peligrosa (respuesta del cliente) |
| `creadoEn` | DateTime | |
| `actualizadoEn` | DateTime | |

**Estados del Turno:**
```
RESERVADO → CONFIRMADO → EN_ESPERA → EN_LINEA → FINALIZADO
                                              ↘ CONDICIONAL
                                              ↘ RECHAZADO
                                    ↘ CANCELADO
```

---

### `Linea`
Líneas de revisión del taller.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `numero` | Int | 1, 2, ... |
| `capacidadPorHora` | Int | Revisiones/hora configurables |
| `activa` | Boolean | Si está operativa hoy |
| `creadoEn` | DateTime | |

---

### `ColaItem`
Un vehículo en la cola de una línea. Se crea al hacer check-in.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `turnoId` | String | FK → Turno (unique) |
| `lineaId` | String | FK → Linea |
| `orden` | Int | Posición en la cola de esa línea |
| `prioridad` | Enum | `CON_TURNO`, `SIN_TURNO` |
| `estado` | Enum | `EN_ESPERA`, `INGRESO`, `EN_REVISION`, `FINALIZADO` |
| `inicioRevision` | DateTime? | Timestamp al pasar a EN_REVISION |
| `finRevision` | DateTime? | Timestamp al finalizar |
| `creadoEn` | DateTime | |

---

### `Cobro`
Registro de pago. Un cobro por turno.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `turnoId` | String | FK → Turno (unique) |
| `monto` | Decimal | |
| `medioPago` | Enum | `EFECTIVO`, `POSNET`, `TRANSFERENCIA`, `PAYWAY` _(Fase 2)_ |
| `estado` | Enum | `PENDIENTE_VALIDACION`, `PAGADO`, `RECHAZADO` |
| `comprobante` | String? | URL del comprobante de transferencia adjunto |
| `aprobadoPor` | String? | FK → Usuario (cajera que aprobó) |
| `creadoEn` | DateTime | |

---

### `Usuario`
Operadores del sistema (técnicos, cajeras, director).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `nombre` | String | |
| `email` | String | Unique |
| `passwordHash` | String | bcrypt |
| `rol` | Enum | `TECNICO`, `CAJERA`, `DIRECTOR` |
| `lineaId` | String? | FK → Linea (para técnicos) |
| `activo` | Boolean | |
| `creadoEn` | DateTime | |

---

### `OverrideLog`
Registro inmutable de cada override hecho por el Director.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `usuarioId` | String | FK → Usuario |
| `turnoId` | String? | FK → Turno (si aplica) |
| `colaItemId` | String? | FK → ColaItem (si aplica) |
| `accion` | String | Descripción de lo que se hizo |
| `justificacion` | String | Texto obligatorio |
| `timestamp` | DateTime | |

---

### `AdvertenciaAceptada`
Registro de los checkboxes aceptados por el cliente al reservar turno.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `turnoId` | String | FK → Turno |
| `tipo` | Enum | `VIDRIOS_POLARIZADOS`, `BANDAS_REFLECTIVAS`, `VIGENCIA_CORTA` |
| `aceptadoEn` | DateTime | |

---

### `CondicionalVencido`
Seguimiento de condicionales en gestión por administración.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `vehiculoId` | String | FK → Vehiculo |
| `fechaCondicional` | DateTime | Fecha del condicional original |
| `diasDesdeCondicional` | Int | Calculado al momento de detectar |
| `estado` | Enum | `BLOQUEADO`, `FORZADO`, `RESUELTO` |
| `turnoForzadoId` | String? | FK → Turno (generado por admin) |
| `forzadoPor` | String? | FK → Usuario |
| `creadoEn` | DateTime | |

---

### `ConfigTaller`
Configuración global del taller. Registro único (singleton).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (uuid) | PK |
| `precios` | Json | Mapa: tipo_vehiculo × tipo_carga → monto |
| `horarios` | Json | Días hábiles, hora apertura/cierre, feriados |
| `datosFiscales` | Json | CUIT, razón social, punto de venta |
| `actualizadoEn` | DateTime | |
| `actualizadoPor` | String | FK → Usuario |

**Estructura del campo `precios` (ejemplo):**
```json
{
  "CARGA_PELIGROSA": 15000,
  "CARGA_COMUN": 12000,
  "PARTICULAR": 10000,
  "PASAJEROS_M1": 11000,
  "PASAJEROS_M2": 13000,
  "PASAJEROS_M3": 14000
}
```

**Estructura del campo `horarios` (ejemplo):**
```json
{
  "diasHabiles": ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"],
  "horaApertura": "08:00",
  "horaCierre": "17:00",
  "feriados": ["2026-05-25", "2026-07-09"]
}
```
