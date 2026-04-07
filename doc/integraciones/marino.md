# Integración con Marino (sistema legado)

## ¿Qué es Marino?

Sistema legado de escritorio que gestiona la facturación y las cuentas corrientes del taller. Corre en una PC local dentro del establecimiento. El taller no puede prescindir de él — en Fase 1, Dynnamo convive con Marino sin reemplazarlo.

---

## Estrategia de integración

**Acceso directo a la base de datos MySQL de Marino**, sin pasar por ninguna API.

```
[NestJS en Railway/VPS]
         │
         │  mysql2 (TCP)
         ▼
[Cloudflare Tunnel]
         │
         │  túnel encriptado
         ▼
[PC local del taller — Bahía Blanca]
         │
         │  localhost:3306
         ▼
[MySQL de Marino]
```

### Por qué Cloudflare Tunnel
- No requiere abrir puertos en el router del taller
- El tráfico está encriptado
- Gratuito para este caso de uso
- La PC local corre el agente `cloudflared` que mantiene el túnel abierto

### Alternativa (si Cloudflare Tunnel falla)
- **Ngrok** — misma topología, plan gratuito con limitaciones de conexiones simultáneas
- **VPN** — más robusto pero requiere configuración de red en el taller

---

## Motor de base de datos

- **MySQL** (confirmado)
- **Driver Node.js:** `mysql2`
- **Versión de MySQL:** a confirmar al conectar (probablemente 5.x o 8.x)

---

## Modo de acceso en Fase 1: solo lectura

En Fase 1, Dynnamo **solo lee** de Marino. No escribe nada.

Esto minimiza el riesgo de corromper los datos del sistema legado mientras se valida el MVP.

---

## Tablas a identificar (pendiente acceso al schema)

El schema de Marino es desconocido. Al obtener acceso, mapear estas tablas:

| Dato que necesitamos | Tabla probable en Marino | Campos a buscar |
|---|---|---|
| Datos del cliente (nombre, CUIT, condición IVA) | `clientes` o `titulares` | nombre, cuit, condicion_iva |
| Historial de revisiones por patente | `revisiones` o `vehiculos` | patente, fecha, resultado, tipo_carga |
| Estado de condicional | `condicionales` o campo en `revisiones` | patente, fecha_condicional, estado |
| Tipo de carga anterior | Mismo que historial | tipo_carga, hace_carga_peligrosa |

---

## Capa de abstracción: MarinoService

En NestJS, toda la interacción con Marino pasa por un único service. El resto del sistema nunca toca `mysql2` directamente.

```typescript
// apps/api/src/marino/marino.service.ts

interface ClienteMarino {
  nombre: string
  cuit: string
  condicionIva: string
}

interface HistorialMarino {
  fecha: Date
  resultado: 'APROBADO' | 'CONDICIONAL' | 'RECHAZADO'
  tipoCarga: string
  vigencia: string
}

interface CondicionalMarino {
  fechaCondicional: Date
  estado: string
  diasTranscurridos: number
}

class MarinoService {
  getClienteByPatente(patente: string): Promise<ClienteMarino | null>
  getHistorialByPatente(patente: string): Promise<HistorialMarino[]>
  getCondicionalByPatente(patente: string): Promise<CondicionalMarino | null>
}
```

### Manejo de errores

Si Marino no responde (túnel caído, PC apagada, MySQL no disponible):
- `MarinoService` devuelve `null` o array vacío
- El flujo **continúa** — no se corta
- El usuario ve la ficha vacía y carga los datos manualmente
- Se loguea el error internamente para monitoreo

---

## Configuración de la conexión

Variables de entorno en el backend:

```env
MARINO_HOST=tunnel-id.cfargotunnel.com   # Endpoint del túnel Cloudflare
MARINO_PORT=3306
MARINO_DATABASE=marino_db                # Nombre de la BD (a confirmar)
MARINO_USER=readonly_user
MARINO_PASSWORD=***
```

Se recomienda crear un **usuario de solo lectura** en MySQL de Marino:
```sql
CREATE USER 'dynnamo_reader'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON marino_db.* TO 'dynnamo_reader'@'%';
FLUSH PRIVILEGES;
```

---

## Próximos pasos para completar la integración

1. Obtener acceso a la PC del taller (coordinar con el cliente)
2. Instalar `cloudflared` en la PC local
3. Crear el túnel en Cloudflare Dashboard
4. Conectar con mysql2 y explorar el schema: `SHOW TABLES; DESCRIBE tabla;`
5. Mapear las tablas necesarias y actualizar los tipos en `MarinoService`
6. Probar las queries en entorno de staging antes de producción

---

## Preguntas pendientes sobre Marino

| # | Pregunta | Impacto |
|---|---|---|
| 12 | ¿Marino permite insertar datos o solo leer? | Define si en Fase 3 se puede escribir resultados |
| 13 | ¿Cómo maneja Marino los condicionales en su BD? | Afecta el mapeo de `CondicionalMarino` |
| 14 | ¿La cajera factura en Marino ANTES o DESPUÉS de que el vehículo pasa por la línea? | Afecta el flujo del cruce antifuga (Fase 3) |
