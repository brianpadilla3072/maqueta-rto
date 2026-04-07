/**
 * Tests del Turnero — siguen el flujo del diagrama mermaid (flujo-turnero.md)
 *
 * Vehículos usados:
 *   ABC 123 — Carga, peligrosa, año 2016 (edad 10), Bs As, sin condicional
 *   DEF 456 — Carga, no peligrosa, año 2019, La Pampa, CTA (cuenta corriente)
 *   GHI 789 — Particular, año 2013, Bs As, condicional 35 días (> 30 → bloqueado)
 *   VEJ 001 — Carga, peligrosa, año 2010 (edad 16 > 10 → aviso vigencia)
 *   PAR 001 — Particular, año 2020, Neuquén (no restringida), sin condicional
 *   CON 020 — Carga, condicional 20 días (≤ 30 → reverificación)
 */

import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import TurneroPage from '@/app/turno/page'

// ── Render helper ────────────────────────────────────────────────
function renderTurnero() {
  const user = userEvent.setup()
  render(
    <MantineProvider>
      <TurneroPage />
    </MantineProvider>
  )
  return { user }
}

// ── Helpers de navegación ────────────────────────────────────────
async function buscarPatente(user: ReturnType<typeof userEvent.setup>, pat: string) {
  await user.type(screen.getByRole('textbox'), pat)
  await user.click(screen.getByRole('button', { name: /buscar/i }))
}

async function confirmarDatos(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /es mi vehículo/i }))
}

async function clickSi(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'SÍ' }))
}

async function clickNo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'NO' }))
}

async function clickEntendido(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /entendido/i }))
}

async function clickVolver(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /volver/i }))
}

// Lleva hasta carga_peligrosa (vehículo encontrado en sistema)
async function navegarHastaCargaPeligrosa(user: ReturnType<typeof userEvent.setup>, pat = 'ABC 123') {
  await buscarPatente(user, pat)
  await confirmarDatos(user)
}

// Lleva hasta advertencia_polarizados pasando por carga_peligrosa con NO
async function navegarHastaPolarizados(user: ReturnType<typeof userEvent.setup>, pat = 'ABC 123') {
  await navegarHastaCargaPeligrosa(user, pat)
  await clickNo(user) // carga peligrosa: NO
}

// Lleva hasta documentacion_cedula (polarizados NO + reflectivas SÍ)
async function navegarHastaDocCedula(user: ReturnType<typeof userEvent.setup>, pat = 'ABC 123') {
  await navegarHastaPolarizados(user, pat)
  await clickNo(user)  // polarizados: NO → reflectivas
  await clickSi(user)  // reflectivas: SÍ → cedula
}

// Lleva hasta facturacion_titular
async function navegarHastaFacturacion(user: ReturnType<typeof userEvent.setup>, pat = 'ABC 123') {
  await navegarHastaDocCedula(user, pat)
  await clickSi(user)  // cedula: SÍ → rto
  await clickNo(user)  // rto anterior: NO → facturacion
}

// ════════════════════════════════════════════════════════════════
// 1. IDENTIFICACIÓN
// ════════════════════════════════════════════════════════════════

describe('Identificación — buscar patente', () => {
  it('vehículo normal encontrado → pantalla de datos', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ABC 123')
    expect(screen.getByRole('heading', { name: /es este tu vehículo/i })).toBeInTheDocument()
  })

  it('patente no encontrada → datos vacíos (sin historial)', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    expect(screen.getByRole('heading', { name: /es este tu vehículo/i })).toBeInTheDocument()
    expect(screen.getByText(/sin historial previo/i)).toBeInTheDocument()
  })

  it('GHI 789: condicional > 30 días → turno bloqueado (derivar a operador)', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'GHI 789')
    expect(screen.getByRole('heading', { name: /turno bloqueado/i })).toBeInTheDocument()
  })

  it('CON 020: condicional ≤ 30 días → reverificación directa', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'CON 020')
    expect(screen.getByRole('heading', { name: /reverificación/i })).toBeInTheDocument()
  })

  it('DEF 456: tiene CTA → pantalla de elección empresa/personal', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'DEF 456')
    expect(screen.getByRole('heading', { name: /cómo querés continuar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cuenta corriente de la empresa/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /uso personal/i })).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 2. CUENTA CORRIENTE (CTA)
// ════════════════════════════════════════════════════════════════

describe('CTA — cuenta corriente', () => {
  it('elegir empresa → estado de cuenta → ir a carga_peligrosa (salta datos y categoría)', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'DEF 456')
    await user.click(screen.getByRole('button', { name: /cuenta corriente de la empresa/i }))
    expect(screen.getByRole('heading', { name: /cliente con cuenta corriente/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /seleccionar turno/i }))
    expect(screen.getByText(/transporta carga peligrosa/i)).toBeInTheDocument()
  })

  it('elegir personal → pantalla de datos del vehículo', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'DEF 456')
    await user.click(screen.getByRole('button', { name: /uso personal/i }))
    expect(screen.getByRole('heading', { name: /es este tu vehículo/i })).toBeInTheDocument()
  })

  it('Volver desde cta_turno → vuelve a la elección, no a datos', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'DEF 456')
    await user.click(screen.getByRole('button', { name: /cuenta corriente de la empresa/i }))
    await clickVolver(user)
    expect(screen.getByRole('heading', { name: /cómo querés continuar/i })).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 3. CLASIFICACIÓN — vehículo encontrado en sistema
// ════════════════════════════════════════════════════════════════

describe('Clasificación — vehículo encontrado en sistema', () => {
  it('ABC 123 (Carga): confirmar datos → carga_peligrosa directamente, sin pantalla de categoría', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ABC 123')
    await confirmarDatos(user)
    expect(screen.getByText(/transporta carga peligrosa/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /categoría del vehículo/i })).not.toBeInTheDocument()
  })

  it('PAR 001 (Particular, Neuquén): confirmar datos → advertencia_polarizados directamente', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'PAR 001')
    await confirmarDatos(user)
    expect(screen.getByText(/vidrios polarizados/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /categoría del vehículo/i })).not.toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 4. CLASIFICACIÓN — ingreso manual (vehículo no encontrado)
// ════════════════════════════════════════════════════════════════

describe('Clasificación — ingreso manual', () => {
  it('N1 Sedán + provincia restringida → hard stop', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    await confirmarDatos(user)
    expect(screen.getByRole('heading', { name: /categoría del vehículo/i })).toBeInTheDocument()
    await user.click(screen.getByText('N1 — Sedán / Auto / SUV'))
    // provincia: SÍ (restringida)
    await clickSi(user)
    expect(screen.getByText(/nueva búsqueda/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /no verificamos/i })).toBeInTheDocument()
  })

  it('N2/N3 → carga_peligrosa', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    await confirmarDatos(user)
    await user.click(screen.getByText('N2 / N3 — Carga'))
    expect(screen.getByText(/transporta carga peligrosa/i)).toBeInTheDocument()
  })

  it('N1 Pick-up + provincia restringida → tipo CARGA, va a carga_peligrosa', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    await confirmarDatos(user)
    await user.click(screen.getByText('N1 — Pick-up'))
    await clickSi(user) // provincia restringida
    expect(screen.getByText(/transporta carga peligrosa/i)).toBeInTheDocument()
  })

  it('N1 Pick-up + otra provincia → pregunta uso particular o carga', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    await confirmarDatos(user)
    await user.click(screen.getByText('N1 — Pick-up'))
    await clickNo(user) // otra provincia
    expect(screen.getByText(/pick-up se usa para carga/i)).toBeInTheDocument()
  })

  it('Pasajeros (M1) sin tacógrafo → hard stop', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    await confirmarDatos(user)
    await user.click(screen.getByText('M1 / M2 / M3 — Pasajeros'))
    await clickNo(user) // tacógrafo: NO
    expect(screen.getByRole('heading', { name: /tacógrafo obligatorio/i })).toBeInTheDocument()
  })

  it('Pasajeros (M1) + cédula no indica pasajeros → hard stop', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'ZZZ 999')
    await confirmarDatos(user)
    await user.click(screen.getByText('M1 / M2 / M3 — Pasajeros'))
    await clickSi(user) // tacógrafo: SÍ
    await clickNo(user) // cédula uso pasajeros: NO
    expect(screen.getByRole('heading', { name: /cédula debe indicar/i })).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 5. AVISO VIGENCIA (ALERTA_CP / ALERTA_P del mermaid)
// ════════════════════════════════════════════════════════════════

describe('Aviso vigencia — ALERTA_CP', () => {
  it('VEJ 001 (Carga peligrosa, edad 16 > 10) → muestra aviso vigencia 4 meses ANTES de validaciones', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'VEJ 001')
    await clickSi(user) // carga peligrosa: SÍ
    expect(screen.getByRole('heading', { name: /vigencia reducida: 4 meses/i })).toBeInTheDocument()
    expect(screen.getByText(/antigüedad \(16 años\)/i)).toBeInTheDocument()
  })

  it('después del aviso → continúa a validaciones (polarizados)', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'VEJ 001')
    await clickSi(user) // carga peligrosa: SÍ → aviso
    await clickEntendido(user) // continuar desde aviso
    expect(screen.getByText(/vidrios polarizados/i)).toBeInTheDocument()
  })

  it('ABC 123 (Carga peligrosa, edad 10, NO > 10) → NO muestra aviso, va directo a polarizados', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'ABC 123')
    await clickSi(user) // carga peligrosa: SÍ
    expect(screen.queryByRole('heading', { name: /vigencia reducida/i })).not.toBeInTheDocument()
    expect(screen.getByText(/vidrios polarizados/i)).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 6. VALIDACIONES — polarizados y reflectivas
// ════════════════════════════════════════════════════════════════

describe('Validaciones — polarizados', () => {
  it('tiene polarizados (SÍ) → pantalla de aviso dedicada (V_ADVERTENCIA del mermaid)', async () => {
    const { user } = renderTurnero()
    await navegarHastaPolarizados(user)
    await clickSi(user) // polarizados: SÍ
    expect(screen.getByRole('heading', { name: /debe retirar los vidrios/i })).toBeInTheDocument()
  })

  it('CARGA + polarizados SÍ → después del aviso va a reflectivas (no salta bandas)', async () => {
    const { user } = renderTurnero()
    await navegarHastaPolarizados(user) // ABC 123 = CARGA
    await clickSi(user) // polarizados: SÍ
    await clickEntendido(user)
    expect(screen.getByText(/bandas reflectivas/i)).toBeInTheDocument()
  })

  it('PARTICULAR + polarizados SÍ → después del aviso va a cedula (salta bandas)', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'PAR 001') // PAR 001 = PARTICULAR
    await clickSi(user) // polarizados: SÍ
    await clickEntendido(user)
    expect(screen.getByText(/cédula verde/i)).toBeInTheDocument()
    expect(screen.queryByText(/bandas reflectivas/i)).not.toBeInTheDocument()
  })

  it('PARTICULAR + polarizados NO → salta bandas directamente a cedula', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'PAR 001')
    await clickNo(user) // polarizados: NO → cedula directa
    expect(screen.getByText(/cédula verde/i)).toBeInTheDocument()
    expect(screen.queryByText(/bandas reflectivas/i)).not.toBeInTheDocument()
  })
})

describe('Validaciones — bandas reflectivas (B_OBS del mermaid)', () => {
  it('CARGA + NO bandas → pantalla de aviso "puede ser observado"', async () => {
    const { user } = renderTurnero()
    await navegarHastaPolarizados(user) // ABC 123 = CARGA
    await clickNo(user)  // polarizados: NO → reflectivas
    await clickNo(user)  // reflectivas: NO → bandas_obs
    expect(screen.getByRole('heading', { name: /puede ser observado/i })).toBeInTheDocument()
  })

  it('después de bandas_obs → continúa a cedula verde', async () => {
    const { user } = renderTurnero()
    await navegarHastaPolarizados(user)
    await clickNo(user)  // polarizados: NO → reflectivas
    await clickNo(user)  // reflectivas: NO → bandas_obs
    await clickEntendido(user)
    expect(screen.getByText(/cédula verde/i)).toBeInTheDocument()
  })

  it('CARGA + SÍ bandas → va a cedula sin aviso', async () => {
    const { user } = renderTurnero()
    await navegarHastaPolarizados(user)
    await clickNo(user) // polarizados: NO → reflectivas
    await clickSi(user) // reflectivas: SÍ → cedula
    expect(screen.getByText(/cédula verde/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /puede ser observado/i })).not.toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 7. DOCUMENTACIÓN
// ════════════════════════════════════════════════════════════════

describe('Documentación', () => {
  it('sin cédula verde (NO) → hard stop, no puede realizar la revisión', async () => {
    const { user } = renderTurnero()
    await navegarHastaDocCedula(user)
    await clickNo(user) // cedula: NO
    expect(screen.getByRole('heading', { name: /no puede realizar/i })).toBeInTheDocument()
  })

  it('RTO anterior SÍ → pantalla "debe presentarlo" (RTO_PRES del mermaid)', async () => {
    const { user } = renderTurnero()
    await navegarHastaDocCedula(user)
    await clickSi(user) // cedula: SÍ → rto
    await clickSi(user) // rto anterior: SÍ → rto_presentar
    expect(screen.getByRole('heading', { name: /debe presentar la rto/i })).toBeInTheDocument()
  })

  it('RTO_PRES → entendido → facturación', async () => {
    const { user } = renderTurnero()
    await navegarHastaDocCedula(user)
    await clickSi(user) // cedula: SÍ
    await clickSi(user) // rto anterior: SÍ → rto_presentar
    await clickEntendido(user)
    expect(screen.getByText(/facturamos/i)).toBeInTheDocument()
  })

  it('RTO anterior NO → facturación directamente (sin pantalla rto_presentar)', async () => {
    const { user } = renderTurnero()
    await navegarHastaDocCedula(user)
    await clickSi(user) // cedula: SÍ
    await clickNo(user)  // rto anterior: NO → facturación directo
    expect(screen.getByText(/facturamos/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /debe presentar/i })).not.toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 8. FACTURACIÓN (FACT_OP del mermaid)
// ════════════════════════════════════════════════════════════════

describe('Facturación', () => {
  it('factura al titular (SÍ) → fecha y horario', async () => {
    const { user } = renderTurnero()
    await navegarHastaFacturacion(user)
    await clickSi(user) // factura titular: SÍ → fecha_hora
    expect(screen.getByRole('heading', { name: /fecha y horario/i })).toBeInTheDocument()
  })

  it('factura a tercero (NO) → pantalla de ingreso de CUIT (FACT_OP del mermaid)', async () => {
    const { user } = renderTurnero()
    await navegarHastaFacturacion(user)
    await clickNo(user) // factura titular: NO → facturacion_tercero
    expect(screen.getByRole('heading', { name: /facturación a tercero/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /cuit/i })).toBeInTheDocument()
  })

  it('completar datos tercero → fecha y horario', async () => {
    const { user } = renderTurnero()
    await navegarHastaFacturacion(user)
    await clickNo(user)
    await user.type(screen.getByRole('textbox', { name: /cuit/i }), '30-12345678-9')
    await user.type(screen.getByRole('textbox', { name: /razón social/i }), 'Empresa Test SA')
    await user.click(screen.getByRole('button', { name: /confirmar y continuar/i }))
    expect(screen.getByRole('heading', { name: /fecha y horario/i })).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════
// 9. NAVEGACIÓN — botones Volver
// ════════════════════════════════════════════════════════════════

describe('Navegación — botones Volver', () => {
  it('Volver desde carga_peligrosa (vehículo encontrado) → datos, no tipo_vehiculo', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'ABC 123')
    await clickVolver(user)
    expect(screen.getByRole('heading', { name: /es este tu vehículo/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /categoría del vehículo/i })).not.toBeInTheDocument()
  })

  it('Volver desde carga_peligrosa (CTA empresa) → cuenta corriente, no tipo_vehiculo', async () => {
    const { user } = renderTurnero()
    await buscarPatente(user, 'DEF 456')
    await user.click(screen.getByRole('button', { name: /cuenta corriente de la empresa/i }))
    await user.click(screen.getByRole('button', { name: /seleccionar turno/i })) // → carga_peligrosa
    await clickVolver(user)
    expect(screen.getByRole('heading', { name: /cliente con cuenta corriente/i })).toBeInTheDocument()
  })

  it('Volver desde polarizados (PAR 001, Particular encontrado) → datos, no provincia', async () => {
    const { user } = renderTurnero()
    await navegarHastaCargaPeligrosa(user, 'PAR 001') // PAR 001 va directo a polarizados
    await clickVolver(user)
    expect(screen.getByRole('heading', { name: /es este tu vehículo/i })).toBeInTheDocument()
    expect(screen.queryByText(/provincia de radicación/i)).not.toBeInTheDocument()
  })

  it('Volver desde bandas_obs → vuelve a reflectivas', async () => {
    const { user } = renderTurnero()
    await navegarHastaPolarizados(user)
    await clickNo(user) // polarizados: NO → reflectivas
    await clickNo(user) // reflectivas: NO → bandas_obs
    await clickVolver(user)
    expect(screen.getByText(/bandas reflectivas/i)).toBeInTheDocument()
  })

  it('Volver desde rto_presentar → documentacion_rto', async () => {
    const { user } = renderTurnero()
    await navegarHastaDocCedula(user)
    await clickSi(user) // cedula: SÍ
    await clickSi(user) // rto anterior: SÍ → rto_presentar
    await clickVolver(user)
    expect(screen.getByText(/rto anterior para presentar/i)).toBeInTheDocument()
  })
})
