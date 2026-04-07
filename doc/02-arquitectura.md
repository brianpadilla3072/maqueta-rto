# Arquitectura del sistema

## Topología general

```
                        INTERNET
                           │
              ┌────────────┴────────────┐
              │                         │
        [Cliente web]            [Taller — Bahía Blanca]
        Turnero / Kiosk          ┌──────────────────────┐
        Display / Admin          │  PC local con Marino │
              │                  │  (MySQL)             │
              ▼                  └──────────┬───────────┘
     ┌─────────────────┐                   │
     │  Next.js (PWA)  │         Cloudflare Tunnel
     │  Vercel         │                   │
     └────────┬────────┘                   │
              │ HTTP/REST                  │
              ▼                            │
     ┌─────────────────┐                  │
     │   NestJS API    │◄─────────────────┘
     │   Railway/VPS   │  mysql2 (lectura)
     └────────┬────────┘
              │ Prisma
              ▼
     ┌─────────────────┐
     │   PostgreSQL    │
     └─────────────────┘
```

---

## Stack tecnológico

### Frontend
| Librería | Versión | Uso |
|---|---|---|
| Next.js | 14+ (App Router) | Framework, rutas, SSR/CSR |
| Mantine | 7+ | Componentes UI (Form, Table, Modal, Calendar, etc.) |
| Zustand | 4+ | Estado global del cliente |
| Zod | 3+ | Validación de formularios y schemas |

### Backend
| Librería | Versión | Uso |
|---|---|---|
| NestJS | 10+ | Framework modular con DI |
| Prisma | 5+ | ORM, migraciones, tipos generados |
| Zod | 3+ | Validación de DTOs y pipes |
| `mysql2` | 3+ | Conexión directa a MySQL de Marino |

### Infraestructura
| Servicio | Uso |
|---|---|
| Vercel | Deploy del frontend Next.js |
| Railway o VPS | Deploy del backend NestJS |
| PostgreSQL | BD principal de Dynnamo |
| Cloudflare Tunnel | Túnel seguro hacia el servidor local del taller |

---

## Principio de arquitectura: una sola app

Todas las interfaces del sistema son **rutas de la misma app Next.js**:

| Ruta | Interfaz | Usuario |
|---|---|---|
| `/turno/nuevo` | Turnero (reserva de turno) | Cliente |
| `/kiosk` | Kiosk de entrada | Cliente (tablet en taller) |
| `/display` | Pantalla del galpón | Nadie (TV en el galpón) |
| `/caja` | Panel de caja | Cajera |
| `/tecnico` | Panel del técnico | Técnico |
| `/admin` | Dashboard de administración | Cajera / Director |
| `/config` | Configuración | Director |

**Sin WebSocket.** Las pantallas en tiempo real (`/display`, `/tecnico`, `/admin`) usan polling con auto-refresh (intervalo configurable, default 10-15s). Es suficiente para la operación del taller.

---

## Estructura de carpetas sugerida

```
rto-dynnamo/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── turno/
│   │   │   ├── kiosk/
│   │   │   ├── display/
│   │   │   ├── caja/
│   │   │   ├── tecnico/
│   │   │   ├── admin/
│   │   │   └── config/
│   │   ├── components/
│   │   ├── stores/             # Zustand stores
│   │   └── lib/
│   │       └── schemas/        # Zod schemas compartidos
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── turno/
│       │   ├── cola/
│       │   ├── caja/
│       │   ├── tecnico/
│       │   ├── admin/
│       │   ├── config/
│       │   ├── marino/         # MarinoService (mysql2)
│       │   └── auth/
│       └── prisma/
│           └── schema.prisma
└── packages/
    └── schemas/                # Zod schemas compartidos front/back
```

---

## Integración con Marino

Marino es un sistema legado de escritorio que corre en una PC dentro del taller. No tiene API propia.

**Estrategia:** acceso directo a su base de datos MySQL a través de un túnel seguro.

```
[NestJS en Railway] → Cloudflare Tunnel → [PC local] → MySQL Marino
```

- **Motor de BD:** MySQL (confirmado)
- **Driver:** `mysql2`
- **Modo Fase 1:** solo lectura
- **Fallback:** si Marino no responde, el flujo continúa con carga manual de datos

Ver detalles en [integraciones/marino.md](./integraciones/marino.md).

---

## Flujo de datos entre sistemas

```
Cliente ingresa patente
        │
        ▼
  Dynnamo consulta Marino (lectura MySQL)
        │
        ▼
  Muestra datos históricos pre-cargados
        │
        ▼
  Cliente confirma/modifica y saca turno
        │
        ▼
  Turno queda en PostgreSQL (Dynnamo)
        │
        ▼
  Al llegar: kiosk lee QR → motor de cola asigna línea
        │
        ▼
  Cajera ve ficha en Dynnamo, cobra, registra en Dynnamo
  (sigue facturando en Marino por separado en Fase 1)
```
