# Visión y contexto del negocio

## El problema

El taller opera con el sistema legado "Marino" (aplicación de escritorio) y procesos completamente presenciales y en papel:

- **6 impresiones físicas** por cada revisión técnica
- Los certificados dependen de una imprenta centralizada en Buenos Aires — un corte de transporte puede dejar sin certificados a todo el sur del país
- **Fila india en la entrada**: un empleado ordena manualmente quién entra a qué línea
- El técnico de línea elige el orden de atención según el sistema nacional RTO
- La cajera recibe al cliente, verifica documentos, factura y cobra — todo manual
- No existe autogestión: el cliente sí o sí debe presentarse en persona con papeles físicos

## El objetivo

Digitalizar el **primer eslabón** del proceso: turno + caja.

- El cliente puede reservar turno desde su casa
- Al llegar al taller, escanea un QR en el kiosk y el sistema le indica a qué línea ir
- La cajera ve los datos pre-cargados en pantalla sin buscar papeles
- El director puede ver el estado de la operación en tiempo real

El sistema **no reemplaza a Marino** en Fase 1 — convive con él y lo complementa.

---

## Actores del sistema

| Actor | Descripción | Interacción con el sistema |
|---|---|---|
| **Cliente individual** ("serialero") | Camionero o particular. Viene esporádicamente. Paga al contado. | Turnero web, kiosk de entrada |
| **Cliente corporativo** ("Corpo") | Empresa con flota (Transener, Cargill, etc.). Necesita factura anticipada. | Turnero web (Fase 2) |
| **Cajera / Administrativa** | Recepciona, verifica documentos, factura, cobra. | Panel de caja, dashboard admin |
| **Técnico de línea** | Realiza la inspección. | Panel del técnico |
| **Director** | Visión macro, control y configuración. | Config, admin, reportes |
| **Sistema Marino** | Software legado de escritorio. Gestiona facturación y cuentas corrientes. | Solo lectura desde Dynnamo (Fase 1) |
| **Sistema nacional RTO** | Plataforma del gobierno. Historial de revisiones por patente. Tiene API. | Consulta al reservar turno (Fase 3) |

---

## Dos tipos de cliente: el Serialero y el Corpo

**Serialero:**
- Camionero independiente que viene con efectivo
- Puede aparecer sin turno el día que quiere
- Necesita que el sistema lo atienda rápido o le diga cuánto esperar

**Corpo:**
- Empresa que manda sus camiones en lotes
- Necesita factura anticipada para que administración apruebe el gasto
- El chofer llega al taller con el turno ya sacado y la factura ya emitida
- Maneja cuenta corriente: no paga en el momento

---

## Visión a futuro (fuera de alcance actual)

- **Certificados digitales**: eliminar la dependencia de la imprenta de Buenos Aires
- **Conectividad con maquinaria**: los resultados de frenos y pesos se registran automáticamente sin intervención humana
- **Multi-taller**: llevar la solución a otros talleres del sistema de cámaras (Santa Fe, Buenos Aires)
- **Control antifuga**: cruzar revisiones hechas en Marino vs. facturas emitidas en Dynnamo

---

## Contexto regulatorio

- Los talleres RTO/VTV operan bajo habilitación del sistema nacional
- El sistema de revisión técnica está en la mira por cuestiones de transparencia — digitalizar agrega trazabilidad
- Hay un cambio de gobierno donde la justificación del proceso es más necesaria que nunca
- Los vehículos N1 (Sedán/Auto/SUV) radicados en Bs. As., Mendoza o CABA no son admitidos en este taller específico (va directo a un taller provincial)
