# Roles y permisos

El sistema tiene **3 roles**. La autenticación usa JWT con el rol embebido en el token. El middleware de NestJS valida el rol en cada endpoint.

---

## Tabla de roles y accesos

| Rol | Rutas frontend | Endpoints API | Restricciones |
|---|---|---|---|
| **Técnico** | `/tecnico` | `/cola/*`, `/turno/:id/estado` | Solo ve su línea asignada. No puede reordenar ni saltar ítems. |
| **Cajera** | `/caja`, `/admin` | `/caja/*`, `/cobro/*`, `/admin/*` | No accede a configuración ni puede forzar overrides. |
| **Director** | Todo | Todo | Puede hacer override, ver logs, configurar el sistema. |

Las rutas `/kiosk`, `/display` y `/turno/nuevo` son **públicas** (no requieren login).

---

## Detalle por rol

### Técnico
- Ve la cola de **su línea asignada** en `/tecnico`
- Puede actualizar el estado de cada ítem: `Ingresó → En revisión → Aprobado / Condicional / Rechazado`
- **No puede:**
  - Ver otras líneas
  - Cambiar el orden de atención
  - Saltar un vehículo
  - Acceder a caja, admin o config

### Cajera
- Busca vehículos por patente en `/caja` → ve ficha pre-cargada desde Marino
- Registra cobros (efectivo, posnet)
- Aprueba o rechaza comprobantes de transferencia
- Gestiona condicionales vencidos desde `/admin` (botón "Forzar Turno")
- Ve cierre de caja del día
- **No puede:**
  - Hacer override de estados del técnico
  - Acceder a configuración
  - Eliminar o modificar cobros ya registrados

### Director
- Accede a todo lo anterior
- Puede **hacer override**: cambiar el orden de atención o saltar pasos. Cada override requiere justificación escrita → queda en el `OverrideLog`
- Accede a `/config` para:
  - Modificar precios por tipo de vehículo/carga
  - Configurar horarios y días hábiles
  - Ajustar capacidad por línea
  - Dar de alta/baja usuarios y cambiar roles

---

## Implementación técnica

### JWT
```
{
  "sub": "userId",
  "email": "usuario@taller.com",
  "rol": "DIRECTOR",  // TECNICO | CAJERA | DIRECTOR
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Guard en NestJS
- `JwtAuthGuard` — valida que el token sea válido
- `RolesGuard` — valida que el rol del token tenga acceso al endpoint
- Decorador `@Roles('DIRECTOR', 'CAJERA')` por endpoint

### Middleware en Next.js
- Las rutas protegidas redirigen a `/login` si no hay token válido
- El componente de layout verifica el rol y oculta/muestra elementos según corresponda
- Las rutas públicas (`/turno/nuevo`, `/kiosk`, `/display`) no requieren token

---

## Override Log

Cuando el Director salta un paso o modifica el orden de la cola:

```
OverrideLog {
  id
  usuarioId      → quién hizo el override
  turnoId        → qué turno fue afectado
  accion         → descripción de la acción (ej: "Saltear vehículo en línea 1")
  justificacion  → texto obligatorio ingresado por el Director
  timestamp      → fecha y hora exacta
}
```

Este log no se puede editar ni eliminar. Es auditable.
