'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box, Stack, Text, TextInput, Button, Group, Card, Badge,
  SimpleGrid, ThemeIcon, Divider, Title, Alert, Grid,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import {
  IconSearch, IconQrcode, IconAlertTriangle, IconCircleCheck,
  IconArrowLeft, IconCar, IconUser, IconCalendar,
  IconCarSuv, IconTruck, IconBus, IconTruckDelivery,
} from '@tabler/icons-react'
import { vehiculos, slotsHorario, slotsOcupados, formatPesos, type Vehiculo } from '@/lib/mock'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { Step, TipoFinal, CategoriaVehiculo } from './types'
import { calcularVigencia, calcularPrecio, ANO_ACTUAL, PROVINCIAS_RESTRINGIDAS } from './helpers'
import { PantallaYesNo, PantallaBloqueo, PantallaAviso } from './pantallas'

dayjs.locale('es')

// ── Componente local: Facturación a tercero ───────────────────────
function FacturacionTercero({ onConfirmar, onVolver }: { onConfirmar: () => void; onVolver: () => void }) {
  const [cuit, setCuit] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack gap="lg" maw={480} w="100%" px="md">
        <Stack gap={4}>
          <Title order={3}>Facturación a tercero</Title>
          <Text size="sm" c="dimmed">Ingresá los datos del responsable de la factura</Text>
        </Stack>
        <TextInput label="CUIT" placeholder="20-12345678-9" value={cuit} onChange={e => setCuit(e.target.value)} size="lg" />
        <TextInput label="Razón social / Nombre" placeholder="Empresa S.A." value={razonSocial} onChange={e => setRazonSocial(e.target.value)} size="lg" />
        <Button size="lg" disabled={cuit.length < 10 || razonSocial.length < 2} onClick={onConfirmar}>
          Confirmar y continuar
        </Button>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={onVolver} size="sm">Volver</Button>
      </Box>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════
function TurneroInner() {
  const searchParams = useSearchParams()

  // ── Estado ────────────────────────────────────────────────────
  const [step, setStep]                           = useState<Step>('patente')
  const [patente, setPatente]                     = useState('')
  const [vehiculo, setVehiculo]                   = useState<Vehiculo | null>(null)
  const [categoria, setCategoria]                 = useState<CategoriaVehiculo | null>(null)
  const [provinciaRestringida, setProvinciaRestringida] = useState<boolean | null>(null)
  const [tipoFinal, setTipoFinal]                 = useState<TipoFinal | null>(null)
  const [cargaPeligrosa, setCargaPeligrosa]       = useState<boolean | null>(null)
  const [fecha, setFecha]                         = useState<Date | null>(null)
  const [hora, setHora]                           = useState<string | null>(null)
  const [escaneando, setEscaneando]               = useState(false)
  const [bloqueoInfo, setBloqueoInfo]             = useState({ titulo: '', mensaje: '' })
  // Guarda el paso de identificación desde donde se llegó a la clasificación,
  // para que los botones Volver de carga_peligrosa y advertencia_polarizados
  // no muestren tipo_vehiculo cuando el vehículo fue encontrado en el sistema.
  const [prevIdentificacion, setPrevIdentificacion] = useState<Step>('datos')

  // ── Pre-rellenar patente desde URL param ─────────────────────
  useEffect(() => {
    const p = searchParams.get('patente')
    if (p) setPatente(p.toUpperCase())
  }, [])

  // ── Valores derivados ─────────────────────────────────────────
  const anio    = vehiculo?.anio ?? 2018
  const edad    = ANO_ACTUAL - anio
  const vigencia = tipoFinal ? calcularVigencia(tipoFinal, cargaPeligrosa ?? false, anio) : ''
  const precio   = tipoFinal ? calcularPrecio(tipoFinal, cargaPeligrosa ?? false) : 12000

  // ── Reset ─────────────────────────────────────────────────────
  const reset = () => {
    setStep('patente'); setPatente(''); setVehiculo(null)
    setCategoria(null); setProvinciaRestringida(null)
    setTipoFinal(null); setCargaPeligrosa(null)
    setFecha(null); setHora(null); setPrevIdentificacion('datos')
  }

  const bloquear = (titulo: string, mensaje: string) => {
    setBloqueoInfo({ titulo, mensaje })
    setStep('bloqueado_jurisdiccion')
  }

  // ── Transiciones — IDENTIFICACIÓN ────────────────────────────
  const buscarPatente = (pat: string) => {
    const norm = (s: string) => s.replace(/\s/g, '').toUpperCase()
    const v = vehiculos.find(v => norm(v.patente) === norm(pat))
    const resultado: Vehiculo = v ?? {
      patente: pat.toUpperCase(), titular: '', cuit: '', condicionIva: 'Consumidor final',
      tipo: 'Carga', peligrosa: false, anio: 2018, jurisdiccion: 'Buenos Aires',
      ultimaRevision: 'Sin historial', vencimiento: '—', condicional: false,
    }
    setVehiculo(resultado)
    if (resultado.condicional) {
      const dias = resultado.diasCondicional ?? 0
      setStep(dias > 30 ? 'condicional_bloqueado' : 'reverificacion')
    } else if (resultado.cuit === '30-87654321-4') {
      setStep('cta_eleccion')
    } else {
      setStep('datos')
    }
  }

  const simularQR = () => {
    setEscaneando(true)
    setTimeout(() => { setEscaneando(false); setPatente('ABC 123'); buscarPatente('ABC 123') }, 1500)
  }

  // Si el vehículo fue encontrado, infiere tipo desde el sistema.
  // Si no fue encontrado, pide selección manual de categoría.
  const continuarDesdeDatos = () => {
    if (!vehiculo?.titular) {
      setStep('tipo_vehiculo')
      return
    }
    const restringida = PROVINCIAS_RESTRINGIDAS.includes(vehiculo.jurisdiccion ?? '')
    if (vehiculo.tipo === 'Particular') {
      if (restringida) {
        bloquear('No verificamos este vehículo', 'Los vehículos de uso particular radicados en Buenos Aires, Mendoza o CABA deben realizar la RTO en su jurisdicción de radicación.')
      } else {
        setTipoFinal('PARTICULAR'); setCategoria('N1_SEDAN')
        setPrevIdentificacion('datos')
        setStep('advertencia_polarizados')
      }
    } else {
      setTipoFinal('CARGA'); setCategoria('N2_N3')
      setPrevIdentificacion('datos')
      setStep('carga_peligrosa')
    }
  }

  // CTA: salta datos y categoría, va directo a validaciones
  const continuarDesdeCTA = () => {
    setPrevIdentificacion('cta_turno')
    if (vehiculo?.tipo === 'Particular') {
      setTipoFinal('PARTICULAR'); setCategoria('N1_SEDAN')
      setStep('advertencia_polarizados')
    } else {
      setTipoFinal('CARGA'); setCategoria('N2_N3')
      setStep('carga_peligrosa')
    }
  }

  // ── Transiciones — CLASIFICACIÓN ─────────────────────────────
  const elegirCategoria = (cat: CategoriaVehiculo) => {
    setCategoria(cat)
    if (cat === 'N1_SEDAN' || cat === 'N1_PICKUP') {
      setStep('provincia')
    } else if (cat === 'N2_N3') {
      setTipoFinal('CARGA'); setStep('carga_peligrosa')
    } else {
      setTipoFinal('PASAJEROS')
      setStep(edad > 13 ? 'bloqueado_jurisdiccion' : 'pasajeros_tacografo')
      if (edad > 13) bloquear('Vehículo no apto', `Los vehículos de pasajeros con más de 13 años de antigüedad (${edad} años) no pueden prestar servicio.`)
    }
  }

  const elegirProvincia = (restringida: boolean) => {
    setProvinciaRestringida(restringida)
    if (categoria === 'N1_SEDAN') {
      if (restringida) {
        bloquear('No verificamos este vehículo', 'Los vehículos N1 (Sedán/Auto/SUV) radicados en Buenos Aires, Mendoza o CABA deben realizar la RTO en su jurisdicción de radicación.')
      } else {
        setTipoFinal('PARTICULAR'); setStep('advertencia_polarizados')
      }
    } else {
      // N1 Pick-up
      if (restringida) { setTipoFinal('CARGA'); setStep('carga_peligrosa') }
      else { setStep('n1_uso') }
    }
  }

  // ALERTA_CP: carga peligrosa + antigüedad > 10 años → aviso antes de validaciones
  const continuarDesdeCP = (cp: boolean) => {
    setCargaPeligrosa(cp)
    setStep(cp && edad > 10 ? 'aviso_vigencia' : 'advertencia_polarizados')
  }

  // ALERTA_P: pasajeros + antigüedad > 10 años → aviso antes de validaciones
  const continuarDesdePasajeros0km = () => {
    setStep(edad > 10 ? 'aviso_vigencia' : 'advertencia_polarizados')
  }

  // ── Transiciones — DOCUMENTACIÓN / FACTURACIÓN ───────────────
  const continuarDesdeDocCedula = () => setStep('documentacion_rto')
  const continuarDesdeDocRto    = () => setStep('facturacion_titular')

  // ══════════════════════════════════════════════════════════════
  // RENDERS — cada bloque corresponde a un nodo del mermaid
  // ══════════════════════════════════════════════════════════════

  // ── IDENTIFICACIÓN ───────────────────────────────────────────

  if (step === 'patente') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={480} w="100%" px="md">
        <Stack align="center" gap={4}>
          <Title order={2}>Reservar turno</Title>
          <Text size="sm" c="dimmed">Ingresá la patente del vehículo</Text>
        </Stack>
        <TextInput
          placeholder="ABC 123" value={patente}
          onChange={e => setPatente(e.target.value.toUpperCase())}
          size="xl" w="100%"
          styles={{ input: { fontFamily: 'monospace', fontSize: 32, letterSpacing: 6, textAlign: 'center', height: 80 } }}
          onKeyDown={e => e.key === 'Enter' && patente.length >= 6 && buscarPatente(patente)}
        />
        <Stack gap="sm" w="100%">
          <Button size="xl" leftSection={<IconSearch size={20} />} onClick={() => buscarPatente(patente)} disabled={patente.length < 6} fullWidth>
            Buscar
          </Button>
          <Button size="lg" variant="light" leftSection={<IconQrcode size={20} />} onClick={simularQR} loading={escaneando} fullWidth>
            {escaneando ? 'Escaneando...' : 'Escanear QR del turno'}
          </Button>
        </Stack>
        <Text size="xs" c="dimmed">Probá con: ABC 123 · DEF 456 · GHI 789</Text>
      </Stack>
    </Box>
  )

  if (step === 'cta_eleccion') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack align="center" gap="xl" maw={560} w="100%" px="md">
        <ThemeIcon size={80} radius="xl" color="blue"><IconUser size={48} /></ThemeIcon>
        <Stack align="center" gap={4}>
          <Title order={2} ta="center">¿Cómo querés continuar?</Title>
          <Text fw={700} ff="monospace" style={{ fontSize: 26, letterSpacing: 4 }}>{vehiculo?.patente}</Text>
          {vehiculo?.titular && <Text size="md" c="dimmed">{vehiculo.titular} · {vehiculo.cuit}</Text>}
        </Stack>
        <Text size="sm" c="dimmed" ta="center">Este vehículo tiene cuenta corriente activa en el taller.</Text>
        <Stack gap="md" w="100%">
          <Button size="xl" color="blue" style={{ height: 80, fontSize: 18, borderRadius: 16 }}
            leftSection={<IconCircleCheck size={24} />} onClick={() => setStep('cta_turno')}>
            Cuenta corriente de la empresa
          </Button>
          <Button size="xl" variant="light" color="gray" style={{ height: 80, fontSize: 18, borderRadius: 16 }}
            leftSection={<IconUser size={24} />} onClick={() => setStep('datos')}>
            Uso personal
          </Button>
        </Stack>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={reset} size="sm">Volver</Button>
      </Box>
    </Box>
  )

  if (step === 'datos') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack gap="lg" maw={560} w="100%" px="md">
        <Stack gap={4}>
          <Title order={3}>¿Es este tu vehículo?</Title>
          <Text size="sm" c="dimmed">Verificá los datos antes de continuar.</Text>
        </Stack>
        <Card withBorder shadow="sm">
          <Group mb="md" gap="sm">
            <ThemeIcon variant="light" size="xl" color="blue"><IconCar size={22} /></ThemeIcon>
            <Text fw={700} ff="monospace" style={{ fontSize: 28, letterSpacing: 4 }}>{vehiculo?.patente}</Text>
          </Group>
          {vehiculo?.titular ? (
            <>
              <Group mb="xs" gap="sm">
                <ThemeIcon variant="light" size="md"><IconUser size={14} /></ThemeIcon>
                <div>
                  <Text fw={600}>{vehiculo.titular}</Text>
                  <Text size="xs" c="dimmed">{vehiculo.cuit || '—'} · {vehiculo.condicionIva}</Text>
                </div>
              </Group>
              <Divider my="sm" />
              <SimpleGrid cols={3}>
                <div><Text size="xs" c="dimmed">Tipo</Text><Text size="sm" fw={500}>{vehiculo.tipo}</Text></div>
                <div><Text size="xs" c="dimmed">Año</Text><Text size="sm" fw={500}>{vehiculo.anio}</Text></div>
                <div><Text size="xs" c="dimmed">Jurisdicción</Text><Text size="sm" fw={500}>{vehiculo.jurisdiccion}</Text></div>
                <div><Text size="xs" c="dimmed">Última revisión</Text><Text size="sm" fw={500}>{vehiculo.ultimaRevision}</Text></div>
                <div><Text size="xs" c="dimmed">Vencimiento</Text><Text size="sm" fw={500}>{vehiculo.vencimiento}</Text></div>
              </SimpleGrid>
            </>
          ) : (
            <Alert color="blue" variant="light">Sin historial previo en el sistema. Completá los datos en caja al llegar.</Alert>
          )}
        </Card>
        <Button size="lg" onClick={continuarDesdeDatos}>Sí, es mi vehículo — Continuar</Button>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={reset} size="sm">Volver</Button>
      </Box>
    </Box>
  )

  if (step === 'reverificacion') return (
    <Box bg="orange.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="orange"><IconAlertTriangle size={48} /></ThemeIcon>
        <Title order={2} c="orange.8">Turno de reverificación</Title>
        <Text size="lg" c="orange.9" fw={500}>Este vehículo tiene un condicional de {vehiculo?.diasCondicional} días.</Text>
        <Text c="dimmed">Como está dentro del plazo de 30 días, se te asignará un turno de reverificación directamente. Acercate a la ventanilla para confirmar.</Text>
        <Badge size="xl" color="orange" variant="filled">REVERIFICACIÓN</Badge>
        <Button size="lg" variant="light" color="orange" leftSection={<IconArrowLeft size={18} />} onClick={reset}>Nueva búsqueda</Button>
      </Stack>
    </Box>
  )

  if (step === 'condicional_bloqueado') return (
    <Box bg="orange.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="orange"><IconAlertTriangle size={48} /></ThemeIcon>
        <Title order={2} c="orange.8">Turno bloqueado</Title>
        <Text size="lg" c="orange.9" fw={500}>Este vehículo tiene un condicional de {vehiculo?.diasCondicional} días sin resolver.</Text>
        <Text c="dimmed">Los condicionales de más de 30 días deben ser gestionados por el personal del taller. Acercate a la ventanilla de administración.</Text>
        <Button size="lg" color="orange" variant="light" leftSection={<IconArrowLeft size={18} />} onClick={reset}>Nueva búsqueda</Button>
      </Stack>
    </Box>
  )

  // ── CUENTA CORRIENTE ─────────────────────────────────────────

  if (step === 'cta_turno') return (
    <Box bg="blue.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="blue"><IconCircleCheck size={48} /></ThemeIcon>
        <Title order={2} c="blue.8">Cliente con cuenta corriente</Title>
        <Card withBorder w="100%">
          <Text fw={700} size="lg">{vehiculo?.titular}</Text>
          <Text size="sm" c="dimmed" mb="sm">{vehiculo?.cuit}</Text>
          <Divider my="xs" />
          <Group justify="space-between">
            <Text size="sm">Saldo de cuenta:</Text>
            <Badge color="green" variant="light">Al día</Badge>
          </Group>
        </Card>
        <Text c="dimmed">El turno se asignará sin necesidad de pago previo.</Text>
        <Button size="lg" color="blue" onClick={continuarDesdeCTA}>Seleccionar turno</Button>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep('cta_eleccion')} size="sm">Volver</Button>
      </Stack>
    </Box>
  )

  // ── CLASIFICACIÓN (solo para vehículos no encontrados en sistema) ─

  if (step === 'tipo_vehiculo') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack gap="lg" maw={600} w="100%" px="md">
        <Stack align="center" gap={4}>
          <Title order={3} ta="center">¿Cuál es la categoría del vehículo?</Title>
          <Text size="sm" c="dimmed">Según la cédula verde</Text>
        </Stack>
        <Stack gap="md" w="100%">
          {([
            { cat: 'N1_SEDAN',  Icon: IconCarSuv,        label: 'N1 — Sedán / Auto / SUV',  sub: 'Automóvil de uso particular',            color: 'blue',   bg: '#e7f5ff', border: '#74c0fc' },
            { cat: 'N1_PICKUP', Icon: IconTruckDelivery,  label: 'N1 — Pick-up',             sub: 'Hasta 3.500 kg de peso total',           color: 'blue',   bg: '#e7f5ff', border: '#74c0fc' },
            { cat: 'N2_N3',     Icon: IconTruck,          label: 'N2 / N3 — Carga',          sub: 'Camión, semi, utilitario de carga',      color: 'orange', bg: '#fff4e6', border: '#ffa94d' },
            { cat: 'M1',        Icon: IconBus,            label: 'M1 / M2 / M3 — Pasajeros', sub: 'Colectivo, minibus, transporte escolar',  color: 'teal',   bg: '#e6fcf5', border: '#63e6be' },
          ] as { cat: CategoriaVehiculo; Icon: React.FC<{size:number}>; label: string; sub: string; color: string; bg: string; border: string }[]).map(({ cat, Icon, label, sub, bg, border, color }) => (
            <Box key={cat} onClick={() => elegirCategoria(cat)}
              style={{ background: bg, border: `2px solid ${border}`, borderRadius: 16, padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, userSelect: 'none', WebkitTapHighlightColor: 'transparent', transition: 'transform 0.1s, box-shadow 0.1s', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
              onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <ThemeIcon size={56} radius="xl" color={color} variant="light" style={{ flexShrink: 0 }}><Icon size={32} /></ThemeIcon>
              <Stack gap={4}>
                <Text fw={700} size="lg" style={{ lineHeight: 1.2 }}>{label}</Text>
                <Text size="sm" c="dimmed">{sub}</Text>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep('datos')} size="sm">Volver</Button>
      </Box>
    </Box>
  )

  if (step === 'provincia') return (
    <PantallaYesNo
      pregunta="¿El vehículo está radicado en Buenos Aires, Mendoza o CABA?"
      subtext="La provincia de radicación determina dónde debe hacerse la RTO"
      onSi={() => elegirProvincia(true)}
      onNo={() => elegirProvincia(false)}
      onVolver={() => setStep('tipo_vehiculo')}
    />
  )

  if (step === 'bloqueado_jurisdiccion') return (
    <PantallaBloqueo
      titulo={bloqueoInfo.titulo}
      mensaje={bloqueoInfo.mensaje}
      onReiniciar={reset}
    />
  )

  if (step === 'n1_uso') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack align="center" gap="xl" maw={600} w="100%" px="md">
        <Text style={{ fontSize: 26, lineHeight: 1.3, textAlign: 'center' }} fw={600}>
          ¿La Pick-up se usa para carga o para uso particular?
        </Text>
        <Text size="md" c="dimmed" ta="center">Esto afecta la tarifa y la vigencia de la RTO</Text>
        <Group gap="lg" w="100%" justify="center">
          <Button size="xl" color="orange" style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 20, borderRadius: 16 }}
            leftSection={<IconTruck size={24} />}
            onClick={() => { setTipoFinal('CARGA'); setStep('carga_peligrosa') }}>Carga</Button>
          <Button size="xl" color="teal" variant="light" style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 20, borderRadius: 16 }}
            leftSection={<IconCarSuv size={24} />}
            onClick={() => { setTipoFinal('PARTICULAR'); setStep('advertencia_polarizados') }}>Particular</Button>
        </Group>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep('provincia')} size="sm">Volver</Button>
      </Box>
    </Box>
  )

  if (step === 'carga_peligrosa') return (
    <PantallaYesNo
      pregunta="¿El vehículo transporta carga peligrosa?"
      subtext="Combustibles, químicos, explosivos u otras sustancias de riesgo (ADR)"
      onSi={() => continuarDesdeCP(true)}
      onNo={() => continuarDesdeCP(false)}
      onVolver={() => {
        if (categoria === 'N1_PICKUP' && provinciaRestringida) setStep('provincia')
        else if (categoria === 'N1_PICKUP') setStep('n1_uso')
        else if (vehiculo?.titular) setStep(prevIdentificacion)
        else setStep('tipo_vehiculo')
      }}
    />
  )

  if (step === 'pasajeros_tacografo') return (
    <PantallaYesNo
      pregunta="¿El vehículo tiene tacógrafo instalado?"
      subtext="Obligatorio para vehículos de transporte de pasajeros"
      onSi={() => setStep('pasajeros_cedula_uso')}
      onNo={() => bloquear('Tacógrafo obligatorio', 'Los vehículos de pasajeros deben contar con tacógrafo instalado para poder realizar la RTO.')}
      onVolver={() => setStep('tipo_vehiculo')}
    />
  )

  if (step === 'pasajeros_cedula_uso') return (
    <PantallaYesNo
      pregunta="¿La cédula verde indica uso para transporte de pasajeros?"
      subtext="Debe estar especificado en el documento del vehículo"
      onSi={() => setStep('pasajeros_0km')}
      onNo={() => bloquear('La cédula debe indicar uso pasajeros', 'La cédula verde del vehículo debe indicar explícitamente el uso para transporte de pasajeros para poder realizar la RTO.')}
      onVolver={() => setStep('pasajeros_tacografo')}
    />
  )

  if (step === 'pasajeros_0km') return (
    <PantallaYesNo
      pregunta="¿El vehículo es 0 km (primera RTO)?"
      subtext="Los vehículos nuevos tienen una vigencia inicial especial"
      onSi={continuarDesdePasajeros0km}
      onNo={continuarDesdePasajeros0km}
      onVolver={() => setStep('pasajeros_cedula_uso')}
    />
  )

  // ── AVISOS INFORMATIVOS (mermaid: ALERTA_CP, ALERTA_P, V_ADVERTENCIA, B_OBS, RTO_PRES) ─

  if (step === 'aviso_vigencia') return (
    <PantallaAviso
      color="orange"
      titulo="Vigencia reducida: 4 meses"
      mensaje={<>
        {tipoFinal === 'CARGA'
          ? `Los vehículos de carga peligrosa con más de 10 años de antigüedad (${edad} años)`
          : `Los vehículos de pasajeros con más de 10 años de antigüedad (${edad} años)`
        } tienen una vigencia de RTO de <strong>4 meses</strong> en caso de aprobar.
      </>}
      onContinuar={() => setStep('advertencia_polarizados')}
      onVolver={() => setStep(tipoFinal === 'PASAJEROS' ? 'pasajeros_0km' : 'carga_peligrosa')}
    />
  )

  if (step === 'advertencia_polarizados_aviso') return (
    <PantallaAviso
      color="orange"
      titulo="Debe retirar los vidrios polarizados"
      mensaje={<>Para poder realizar la RTO el vehículo <strong>no puede tener vidrios polarizados</strong>. Deberá retirarlos antes de ingresar a la línea de inspección, de lo contrario no resultará apto.</>}
      onContinuar={() => setStep(tipoFinal === 'PARTICULAR' ? 'documentacion_cedula' : 'advertencia_reflectivas')}
      onVolver={() => setStep('advertencia_polarizados')}
    />
  )

  if (step === 'bandas_obs') return (
    <PantallaAviso
      color="orange"
      titulo="El vehículo puede ser observado"
      mensaje={<>Los vehículos de carga y transporte sin bandas reflectivas reglamentarias pueden ser <strong>observados durante la inspección</strong> y no resultar aptos.</>}
      onContinuar={() => setStep('documentacion_cedula')}
      onVolver={() => setStep('advertencia_reflectivas')}
    />
  )

  if (step === 'rto_presentar') return (
    <PantallaAviso
      color="blue"
      titulo="Debe presentar la RTO anterior"
      mensaje={<>Al momento de la inspección deberá presentar el <strong>certificado de RTO anterior</strong> del vehículo. Sin él no se puede completar la revisión.</>}
      onContinuar={continuarDesdeDocRto}
      onVolver={() => setStep('documentacion_rto')}
      labelContinuar="Entendido, continuar"
    />
  )

  // ── VALIDACIONES ─────────────────────────────────────────────

  if (step === 'advertencia_polarizados') return (
    <PantallaYesNo
      pregunta="¿El vehículo tiene vidrios polarizados?"
      subtext="Los polarizados deben retirarse antes de ingresar a la línea de inspección"
      onSi={() => setStep('advertencia_polarizados_aviso')}
      onNo={() => setStep(tipoFinal === 'PARTICULAR' ? 'documentacion_cedula' : 'advertencia_reflectivas')}
      onVolver={() => {
        if (vehiculo?.titular && tipoFinal !== 'PASAJEROS') setStep(prevIdentificacion)
        else if (tipoFinal === 'PARTICULAR' && categoria === 'N1_SEDAN') setStep('provincia')
        else if (tipoFinal === 'PARTICULAR') setStep('n1_uso')
        else if (tipoFinal === 'PASAJEROS') setStep('pasajeros_0km')
        else setStep('carga_peligrosa')
      }}
    />
  )

  if (step === 'advertencia_reflectivas') return (
    <PantallaYesNo
      pregunta="¿El vehículo cuenta con bandas reflectivas reglamentarias?"
      subtext="Requeridas para vehículos de carga y transporte según normativa DNRPA"
      onSi={() => setStep('documentacion_cedula')}
      onNo={() => setStep('bandas_obs')}
      onVolver={() => setStep('advertencia_polarizados')}
    />
  )

  // ── DOCUMENTACIÓN ────────────────────────────────────────────

  if (step === 'documentacion_cedula') return (
    <PantallaYesNo
      pregunta="¿El conductor tiene la cédula verde del vehículo?"
      subtext="Es obligatoria para realizar la revisión técnica"
      onSi={continuarDesdeDocCedula}
      onNo={() => bloquear('No puede realizar la revisión', 'La cédula verde del vehículo es obligatoria para realizar la RTO. Debe presentarla al momento de la inspección.')}
      onVolver={() => tipoFinal === 'PARTICULAR' ? setStep('advertencia_polarizados') : setStep('advertencia_reflectivas')}
    />
  )

  if (step === 'documentacion_rto') return (
    <PantallaYesNo
      pregunta="¿El vehículo tiene una RTO anterior para presentar?"
      subtext="Si ya tuvo RTO debe presentar el certificado anterior en el momento de la inspección"
      onSi={() => setStep('rto_presentar')}
      onNo={continuarDesdeDocRto}
      onVolver={() => setStep('documentacion_cedula')}
    />
  )

  // ── FACTURACIÓN ──────────────────────────────────────────────

  if (step === 'facturacion_titular') return (
    <PantallaYesNo
      pregunta={vehiculo?.titular ? `¿Facturamos a ${vehiculo.titular}?` : '¿Facturamos al titular del vehículo?'}
      subtext={vehiculo?.cuit ? `CUIT ${vehiculo.cuit} · ${vehiculo.condicionIva}` : 'No hay datos previos de facturación'}
      onSi={() => setStep('fecha_hora')}
      onNo={() => setStep('facturacion_tercero')}
      onVolver={() => setStep('documentacion_rto')}
    />
  )

  if (step === 'facturacion_tercero') return (
    <FacturacionTercero
      onConfirmar={() => setStep('fecha_hora')}
      onVolver={() => setStep('facturacion_titular')}
    />
  )

  // ── FECHA, HORA Y CONFIRMACIÓN ───────────────────────────────

  if (step === 'fecha_hora') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack gap="lg" maw={680} w="100%" px="md">
        <Stack gap={4}>
          <Title order={3}>Elegí fecha y horario</Title>
          <Group gap="md">
            <Badge size="lg" color="blue" variant="light">Vigencia: {vigencia}</Badge>
            <Badge size="lg" color="green" variant="light">Precio: {formatPesos(precio)}</Badge>
          </Group>
        </Stack>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <DatePicker
              value={fecha} onChange={setFecha}
              excludeDate={(d) => dayjs(d).isBefore(dayjs(), 'day') || [0, 6].includes(d.getDay())}
              minDate={new Date()}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            {fecha ? (
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  <IconCalendar size={14} style={{ marginRight: 6 }} />
                  {dayjs(fecha).format('dddd DD/MM/YYYY')}
                </Text>
                <SimpleGrid cols={3}>
                  {slotsHorario.map((slot) => {
                    const ocupado = slotsOcupados.includes(slot)
                    return (
                      <Button key={slot} variant={hora === slot ? 'filled' : 'light'}
                        color={ocupado ? 'gray' : 'blue'} disabled={ocupado} size="sm"
                        onClick={() => setHora(slot)}>{slot}</Button>
                    )
                  })}
                </SimpleGrid>
              </Stack>
            ) : (
              <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
                <Text c="dimmed" size="sm" ta="center">Seleccioná un día para ver los horarios disponibles</Text>
              </Box>
            )}
          </Grid.Col>
        </Grid>
        <Button size="lg" disabled={!fecha || !hora} onClick={() => setStep('confirmacion')}>
          Confirmar turno
        </Button>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />}
          onClick={() => setStep('facturacion_titular')} size="sm">Volver</Button>
      </Box>
    </Box>
  )

  if (step === 'confirmacion') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={360} w="100%" px="md">
        <ThemeIcon size={80} radius="xl" color="green"><IconCircleCheck size={48} /></ThemeIcon>
        <Title order={2} ta="center">¡Turno confirmado!</Title>
        <Text c="dimmed" ta="center" size="sm">Mostrá este QR al llegar al taller.</Text>
        <Card withBorder w="100%" ta="center" shadow="md">
          <Stack gap="sm">
            <Text fw={700} fz={28} ff="monospace" style={{ letterSpacing: 6 }}>{vehiculo?.patente}</Text>
            {vehiculo?.titular && <Text size="sm">{vehiculo.titular}</Text>}
            <Divider />
            <Text size="sm" fw={500}>{fecha ? dayjs(fecha).format('dddd DD/MM/YYYY') : ''} — {hora}</Text>
            <Group justify="center" gap="xs">
              <Badge color="blue" variant="light">Vigencia: {vigencia}</Badge>
              <Badge color="green" variant="light">{formatPesos(precio)}</Badge>
            </Group>
            <Box bg="dark" p="xl" mt="xs" style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconQrcode size={120} color="white" />
            </Box>
            <Badge color="green" size="lg" variant="filled">RESERVADO</Badge>
          </Stack>
        </Card>
        <Button variant="light" onClick={reset} fullWidth>Reservar otro turno</Button>
      </Stack>
    </Box>
  )

  return null
}

export default function TurneroPage() {
  return <Suspense><TurneroInner /></Suspense>
}
