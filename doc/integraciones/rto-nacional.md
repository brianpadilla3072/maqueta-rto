# Integración con el sistema nacional RTO

## ¿Qué es el sistema nacional RTO?

Plataforma web del gobierno nacional que registra el historial de revisiones técnicas de todos los vehículos del país. Permite consultar por patente: cuándo fue la última revisión, resultado, tipo de carga declarada y titular registrado.

**Tiene API** — endpoint y autenticación a confirmar con el organismo (DNRPA o similar).

---

## Uso en el sistema

El sistema nacional RTO se consulta en **un solo lugar**: el Paso 1 del turnero.

```
Cliente ingresa patente en /turno/nuevo
        │
        ▼
GET /turno/patente/:patente
        │
        ├── Consulta Marino (lectura local)
        └── Consulta sistema nacional RTO (API externa)
                │
                ▼
        Datos devueltos al frontend:
        - Última revisión (fecha, resultado)
        - Tipo de carga declarado
        - Titular registrado
        - Vencimiento del certificado actual
```

---

## Datos a extraer

| Dato | Uso en Dynnamo |
|---|---|
| Fecha de última revisión | Verificar si el vencimiento está próximo |
| Resultado (Aprobado / Condicional) | Detectar condicionales previos |
| Tipo de carga declarado | Pre-completar la pregunta "¿hace carga peligrosa?" |
| Titular registrado | Comparar con la cédula verde al hacer check-in |
| Año de fabricación del vehículo | Calcular antigüedad para la matriz de vigencias |
| Jurisdicción de radicación | Aplicar Hard Stops por jurisdicción |

---

## Implementación: RtoNacionalService

```typescript
// apps/api/src/rto-nacional/rto-nacional.service.ts

interface DatosRtoNacional {
  patente: string
  ultimaRevision: Date | null
  resultado: 'APROBADO' | 'CONDICIONAL' | 'RECHAZADO' | null
  tipoCarga: string | null
  titular: string | null
  anioFabricacion: number | null
  jurisdiccion: string | null
  vencimiento: Date | null
}

class RtoNacionalService {
  getDatosByPatente(patente: string): Promise<DatosRtoNacional | null>
}
```

### Manejo de errores

- Si la API no responde → `null` → el frontend muestra el formulario vacío para carga manual
- Si la patente no existe en el sistema nacional → `null` → carga manual
- El flujo nunca se corta por fallos de esta integración

---

## Variables de entorno

```env
RTO_NACIONAL_API_URL=https://api.rto.gob.ar   # A confirmar
RTO_NACIONAL_API_KEY=***                        # A confirmar con el organismo
```

---

## Estado actual

| Ítem | Estado |
|---|---|
| Confirmación de existencia de API | ✅ Confirmado que tiene API |
| Endpoint exacto | ⏳ Pendiente |
| Esquema de autenticación | ⏳ Pendiente (token, certificado, CUIT) |
| Rate limits | ⏳ Pendiente |
| Datos disponibles en el response | ⏳ Pendiente |

---

## Plan de acción

1. Contactar al organismo (DNRPA o la autoridad jurisdiccional) para obtener credenciales
2. Revisar documentación de la API (si existe pública)
3. Si no hay API oficial → evaluar scraping de la web pública del sistema RTO
4. Implementar `RtoNacionalService` una vez confirmado el endpoint
5. Esta integración está planificada para **Fase 3** del desarrollo

---

## Alternativa: scraping

Si no hay API oficial disponible:

- El sistema nacional RTO tiene una web pública de consulta por patente
- Se puede implementar scraping con `puppeteer` o `cheerio` + `axios`
- **Riesgos del scraping:**
  - Puede romperse si cambia el HTML de la página
  - Puede haber bloqueos por IP si se hacen muchas consultas
  - No está oficialmente soportado
- **Mitigación:** cache de consultas recientes (si consultamos la misma patente 3 veces en un día, solo hacemos 1 request real)

La decisión entre API oficial vs scraping depende de la respuesta del organismo.
