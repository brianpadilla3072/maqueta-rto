# RTO Dynnamo — Documentación Técnica

Sistema de digitalización del primer eslabón operativo de un taller de Revisión Técnica Obligatoria (RTO/VTV) en Bahía Blanca. Reemplaza la fila humana, el papel y la asignación manual con una app web que gestiona turnos, cola de atención y caja.

**Estado:** Fase 1 — MVP en desarrollo

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (PWA — app de rutas únicas) |
| UI | Mantine |
| Estado global | Zustand |
| Validación | Zod (compartido front/back) |
| Backend | NestJS |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Integración Marino | `mysql2` vía Cloudflare Tunnel |

---

## Índice

### Fundamentos
| Archivo | Contenido |
|---|---|
| [01-vision.md](./01-vision.md) | Contexto del negocio, problema, actores del sistema |
| [02-arquitectura.md](./02-arquitectura.md) | Topología, stack, estructura de carpetas |
| [03-reglas-de-negocio.md](./03-reglas-de-negocio.md) | Hard Stops, Matriz RTO, vigencias, condicionales |
| [04-roles-y-permisos.md](./04-roles-y-permisos.md) | 3 roles y sus accesos por ruta |
| [05-schema-db.md](./05-schema-db.md) | Tablas Prisma con campos y relaciones |
| [06-flujos.md](./06-flujos.md) | User journeys A / B / C / D paso a paso |

### Módulos
| Archivo | Contenido |
|---|---|
| [modulos/01-turnero.md](./modulos/01-turnero.md) | Portal de reserva de turno online |
| [modulos/02-kiosk.md](./modulos/02-kiosk.md) | Check-in presencial con QR en la entrada |
| [modulos/03-cola-display.md](./modulos/03-cola-display.md) | Motor de cola y pantalla del galpón |
| [modulos/04-caja.md](./modulos/04-caja.md) | Panel de la cajera: cobro y ticket |
| [modulos/05-tecnico.md](./modulos/05-tecnico.md) | Panel del técnico: estados de la revisión |
| [modulos/06-admin.md](./modulos/06-admin.md) | Dashboard de administración |
| [modulos/07-config.md](./modulos/07-config.md) | Configuración del sistema (Director) |

### Integraciones
| Archivo | Contenido |
|---|---|
| [integraciones/marino.md](./integraciones/marino.md) | Bridge MySQL con sistema Marino legado |
| [integraciones/rto-nacional.md](./integraciones/rto-nacional.md) | API del sistema nacional RTO |
| [integraciones/payway.md](./integraciones/payway.md) | Pasarela de pago PayWay (Fase 2) |

### Diagramas
| Archivo | Contenido |
|---|---|
| [diagramas/flujo-turnero.md](./diagramas/flujo-turnero.md) | Flowchart completo del árbol de decisión del turnero (Mermaid) |

---

## Fases de desarrollo

| Fase | Alcance | Horas |
|---|---|---|
| **Fase 1 — MVP** | Turnero + Kiosk + Cola + Caja + Técnico + Admin | 338h |
| Fase 2 — Pagos online | PayWay + envío de comprobante por mail | ~38h |
| Fase 3 — RTO nacional | Integración API sistema nacional RTO | 24h |
| Fase 4 — Multi-taller | Multi-tenant, conectividad con maquinaria | TBD |
