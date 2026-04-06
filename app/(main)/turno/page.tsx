'use client'
import React, { useState } from 'react'
import {
  Box, Stack, Text, TextInput, Button, Group, Card, Badge,
  SimpleGrid, ThemeIcon, Divider, Title, Alert, Grid,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import {
  IconSearch, IconQrcode, IconAlertTriangle, IconCircleCheck,
  IconArrowLeft, IconCar, IconUser, IconCalendar, IconX,
  IconCarSuv, IconTruck, IconBus, IconTruckDelivery,
} from '@tabler/icons-react'
import { vehiculos, slotsHorario, slotsOcupados, formatPesos, type Vehiculo } from '@/lib/mock'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

// ── Tipos ────────────────────────────────────────────────────────
type CategoriaVehiculo = 'N1_SEDAN' | 'N1_PICKUP' | 'N2_N3' | 'M1' | 'M2' | 'M3'
type TipoFinal = 'CARGA' | 'PARTICULAR' | 'PASAJEROS'
type ProvinciaRestringida = boolean // true = Bs As / Mendoza / CABA

type Step =
  | 'patente'
  | 'datos'
  | 'reverificacion'
  | 'condicional_bloqueado'
  | 'cta_turno'
  | 'tipo_vehiculo'
  | 'provincia'
  | 'bloqueado_jurisdiccion'
  | 'n1_uso'
  | 'carga_peligrosa'
  | 'pasajeros_tacografo'
  | 'pasajeros_cedula_uso'
  | 'pasajeros_0km'
  | 'advertencia_polarizados'
  | 'advertencia_reflectivas'
  | 'advertencia_vigencia'
  | 'documentacion_cedula'
  | 'documentacion_rto'
  | 'facturacion_titular'
  | 'fecha_hora'
  | 'confirmacion'

// ── Helpers de vigencia ──────────────────────────────────────────
function calcularVigencia(tipo: TipoFinal, cp: boolean, anio: number): string {
  const edad = 2026 - anio
  if (tipo === 'CARGA' && cp) return edad < 10 ? '1 año' : '4 meses'
  if (tipo === 'CARGA' && !cp) return edad < 10 ? '1 año' : '6 meses'
  if (tipo === 'PARTICULAR') return edad < 7 ? '2 años' : '1 año'
  if (tipo === 'PASAJEROS') return edad < 10 ? '6 meses' : '4 meses'
  return '1 año'
}

function calcularPrecio(tipo: TipoFinal, cp: boolean): number {
  if (tipo === 'CARGA' && cp) return 15000
  if (tipo === 'PASAJEROS') return 13000
  return 12000
}

// ── Componente: Pantalla YES/NO ───────────────────────────────────
function PantallaYesNo({
  pregunta, subtext, onSi, onNo, onVolver,
}: {
  pregunta: string
  subtext?: string
  onSi: () => void
  onNo: () => void
  onVolver: () => void
}) {
  return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack align="center" gap="xl" maw={600} w="100%" px="md">
        <Text style={{ fontSize: 28, lineHeight: 1.3, textAlign: 'center' }} fw={600}>
          {pregunta}
        </Text>
        {subtext && <Text size="md" c="dimmed" ta="center">{subtext}</Text>}
        <Group gap="lg" mt="lg" w="100%" justify="center">
          <Button
            size="xl"
            color="green"
            style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 24, borderRadius: 16 }}
            onClick={onSi}
          >
            SÍ
          </Button>
          <Button
            size="xl"
            color="red"
            variant="light"
            style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 24, borderRadius: 16 }}
            onClick={onNo}
          >
            NO
          </Button>
        </Group>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={onVolver} size="sm">Volver</Button>
      </Box>
    </Box>
  )
}

// ── Componente: Pantalla de bloqueo (Hard Stop) ───────────────────
function PantallaBloqueo({
  titulo, mensaje, onReiniciar,
}: {
  titulo: string
  mensaje: string
  onReiniciar: () => void
}) {
  return (
    <Box bg="red.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="red"><IconX size={48} /></ThemeIcon>
        <Title order={2} c="red.8">{titulo}</Title>
        <Text size="lg" c="red.9">{mensaje}</Text>
        <Button size="lg" color="red" variant="light" leftSection={<IconArrowLeft size={18} />} onClick={onReiniciar}>
          Nueva búsqueda
        </Button>
      </Stack>
    </Box>
  )
}

// ── Componente principal ─────────────────────────────────────────
export default function TurneroPage() {
  const [step, setStep] = useState<Step>('patente')
  const [patente, setPatente] = useState('')
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [categoria, setCategoria] = useState<CategoriaVehiculo | null>(null)
  const [provinciaRestringida, setProvinciaRestringida] = useState<ProvinciaRestringida | null>(null)
  const [tipoFinal, setTipoFinal] = useState<TipoFinal | null>(null)
  const [cargaPeligrosa, setCargaPeligrosa] = useState<boolean | null>(null)
  const [fecha, setFecha] = useState<Date | null>(null)
  const [hora, setHora] = useState<string | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [bloqueoInfo, setBloqueoInfo] = useState<{ titulo: string; mensaje: string }>({ titulo: '', mensaje: '' })

  const bloquear = (titulo: string, mensaje: string) => {
    setBloqueoInfo({ titulo, mensaje })
    setStep('bloqueado_jurisdiccion')
  }

  // Vigencia y precio derivados
  const anio = vehiculo?.anio ?? 2018
  const vigencia = tipoFinal ? calcularVigencia(tipoFinal, cargaPeligrosa ?? false, anio) : ''
  const precio = tipoFinal ? calcularPrecio(tipoFinal, cargaPeligrosa ?? false) : 12000

  // ── Reset ──
  const reset = () => {
    setStep('patente'); setPatente(''); setVehiculo(null)
    setCategoria(null); setProvinciaRestringida(null)
    setTipoFinal(null); setCargaPeligrosa(null)
    setFecha(null); setHora(null)
  }

  // ── Buscar patente ──
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
    } else {
      setStep('datos')
    }
  }

  const simularQR = () => {
    setEscaneando(true)
    setTimeout(() => { setEscaneando(false); setPatente('ABC 123'); buscarPatente('ABC 123') }, 1500)
  }

  // ── Después de confirmar datos → verificar cuenta corriente ──
  const continuarDesdeDatos = () => {
    // Simula: Transener SA tiene cuenta corriente
    if (vehiculo?.cuit === '30-87654321-4') {
      setStep('cta_turno')
    } else {
      setStep('tipo_vehiculo')
    }
  }

  // ── Después de elegir categoría ──
  const elegirCategoria = (cat: CategoriaVehiculo) => {
    setCategoria(cat)
    if (cat === 'N1_SEDAN' || cat === 'N1_PICKUP') {
      setStep('provincia')
    } else if (cat === 'N2_N3') {
      setTipoFinal('CARGA')
      setStep('carga_peligrosa')
    } else {
      // M1/M2/M3 → pasajeros
      setTipoFinal('PASAJEROS')
      // Hard stop automático por antigüedad > 13 años
      if (2026 - anio > 13) {
        bloquear('Vehículo no apto', `Los vehículos de pasajeros con más de 13 años de antigüedad (${2026 - anio} años) no pueden prestar servicio y no son admitidos en este taller.`)
      } else {
        setStep('pasajeros_tacografo')
      }
    }
  }

  // ── Después de elegir provincia ──
  const elegirProvincia = (restringida: boolean) => {
    setProvinciaRestringida(restringida)
    if (categoria === 'N1_SEDAN') {
      if (restringida) {
        bloquear('No verificamos este vehículo', 'Los vehículos N1 (Sedán/Auto/SUV) radicados en Buenos Aires, Mendoza o CABA deben realizar la RTO en su jurisdicción de radicación.')
      } else {
        setTipoFinal('PARTICULAR')
        setStep('advertencia_polarizados')
      }
    } else {
      // N1 Pick-up
      if (restringida) {
        setTipoFinal('CARGA')
        setStep('carga_peligrosa')
      } else {
        setStep('n1_uso')
      }
    }
  }

  // ── Después de carga peligrosa → validaciones ──
  const continuarDesdeCP = (cp: boolean) => {
    setCargaPeligrosa(cp)
    setStep('advertencia_polarizados')
  }

  // ── Orden de validaciones → documentación → facturación ──
  const siguienteDesdeReflectivas = () => {
    setStep('documentacion_cedula')
  }

  const continuarDesdeDocCedula = () => {
    setStep('documentacion_rto')
  }

  const continuarDesdeDocRto = () => {
    setStep('facturacion_titular')
  }

  const continuarDesdeFact = () => {
    // Si vigencia = 4 meses, mostrar advertencia
    const cp = cargaPeligrosa ?? false
    const v = tipoFinal ? calcularVigencia(tipoFinal, cp, anio) : ''
    if (v === '4 meses') {
      setStep('advertencia_vigencia')
    } else {
      setStep('fecha_hora')
    }
  }

  // ── Paso previo a advertencia_reflectivas ──
  const volverStepAnteriorAReflectivas = () => {
    if (tipoFinal === 'CARGA') setStep('carga_peligrosa')
    else if (tipoFinal === 'PASAJEROS') setStep('pasajeros_0km')
    else setStep('advertencia_polarizados')
  }

  // ══════════════════════════════════════════════════════════════
  // RENDERS
  // ══════════════════════════════════════════════════════════════

  // ── PATENTE ──
  if (step === 'patente') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={480} w="100%" px="md">
        <Stack align="center" gap={4}>
          <Title order={2}>Reservar turno</Title>
          <Text size="sm" c="dimmed">Ingresá la patente del vehículo</Text>
        </Stack>
        <TextInput
          placeholder="ABC 123"
          value={patente}
          onChange={e => setPatente(e.target.value.toUpperCase())}
          size="xl"
          w="100%"
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

  // ── DATOS DEL VEHÍCULO ──
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

  // ── REVERIFICACIÓN (condicional < 30 días) ──
  if (step === 'reverificacion') return (
    <Box bg="orange.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="orange"><IconAlertTriangle size={48} /></ThemeIcon>
        <Title order={2} c="orange.8">Turno de reverificación</Title>
        <Text size="lg" c="orange.9" fw={500}>
          Este vehículo tiene un condicional de {vehiculo?.diasCondicional} días.
        </Text>
        <Text c="dimmed">
          Como está dentro del plazo de 30 días, se te asignará un turno de reverificación directamente. Acercate a la ventanilla para confirmar.
        </Text>
        <Badge size="xl" color="orange" variant="filled">REVERIFICACIÓN</Badge>
        <Button size="lg" variant="light" color="orange" leftSection={<IconArrowLeft size={18} />} onClick={reset}>
          Nueva búsqueda
        </Button>
      </Stack>
    </Box>
  )

  // ── CONDICIONAL BLOQUEADO (> 30 días) ──
  if (step === 'condicional_bloqueado') return (
    <Box bg="orange.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="orange"><IconAlertTriangle size={48} /></ThemeIcon>
        <Title order={2} c="orange.8">Turno bloqueado</Title>
        <Text size="lg" c="orange.9" fw={500}>
          Este vehículo tiene un condicional de {vehiculo?.diasCondicional} días sin resolver.
        </Text>
        <Text c="dimmed">Los condicionales de más de 30 días deben ser gestionados por el personal del taller. Acercate a la ventanilla de administración.</Text>
        <Button size="lg" color="orange" variant="light" leftSection={<IconArrowLeft size={18} />} onClick={reset}>
          Nueva búsqueda
        </Button>
      </Stack>
    </Box>
  )

  // ── CUENTA CORRIENTE ──
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
        <Text c="dimmed">El turno se asignará sin necesidad de pago previo. Continuá a seleccionar fecha y horario.</Text>
        <Button size="lg" color="blue" onClick={() => setStep('tipo_vehiculo')}>Seleccionar turno</Button>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep('datos')} size="sm">Volver</Button>
      </Stack>
    </Box>
  )

  // ── TIPO DE VEHÍCULO ──
  if (step === 'tipo_vehiculo') return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack gap="lg" maw={600} w="100%" px="md">
        <Stack align="center" gap={4}>
          <Title order={3} ta="center">¿Cuál es la categoría del vehículo?</Title>
          <Text size="sm" c="dimmed">Según la cédula verde</Text>
        </Stack>
        <Stack gap="md" w="100%">
          {([
            { cat: 'N1_SEDAN',  Icon: IconCarSuv,       label: 'N1 — Sedán / Auto / SUV',  sub: 'Automóvil de uso particular',           color: 'blue',   bg: '#e7f5ff', border: '#74c0fc' },
            { cat: 'N1_PICKUP', Icon: IconTruckDelivery, label: 'N1 — Pick-up',             sub: 'Hasta 3.500 kg de peso total',          color: 'blue',   bg: '#e7f5ff', border: '#74c0fc' },
            { cat: 'N2_N3',     Icon: IconTruck,         label: 'N2 / N3 — Carga',          sub: 'Camión, semi, utilitario de carga',     color: 'orange', bg: '#fff4e6', border: '#ffa94d' },
            { cat: 'M1',        Icon: IconBus,           label: 'M1 / M2 / M3 — Pasajeros', sub: 'Colectivo, minibus, transporte escolar', color: 'teal',   bg: '#e6fcf5', border: '#63e6be' },
          ] as { cat: CategoriaVehiculo; Icon: React.FC<{size:number}>; label: string; sub: string; color: string; bg: string; border: string }[]).map(({ cat, Icon, label, sub, bg, border, color }) => (
            <Box
              key={cat}
              onClick={() => elegirCategoria(cat)}
              style={{
                background: bg,
                border: `2px solid ${border}`,
                borderRadius: 16,
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.1s, box-shadow 0.1s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
              onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <ThemeIcon size={56} radius="xl" color={color} variant="light" style={{ flexShrink: 0 }}>
                <Icon size={32} />
              </ThemeIcon>
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

  // ── PROVINCIA ──
  if (step === 'provincia') return (
    <PantallaYesNo
      pregunta="¿El vehículo está radicado en Buenos Aires, Mendoza o CABA?"
      subtext="La provincia de radicación determina dónde debe hacerse la RTO"
      onSi={() => elegirProvincia(true)}
      onNo={() => elegirProvincia(false)}
      onVolver={() => setStep('tipo_vehiculo')}
    />
  )

  // ── BLOQUEADO (todos los hard stops) ──
  if (step === 'bloqueado_jurisdiccion') return (
    <PantallaBloqueo
      titulo={bloqueoInfo.titulo || 'No verificamos este vehículo'}
      mensaje={bloqueoInfo.mensaje || 'Los vehículos N1 radicados en Buenos Aires, Mendoza o CABA deben realizar la RTO en su jurisdicción de radicación.'}
      onReiniciar={reset}
    />
  )

  // ── N1 PICK-UP — USO PARTICULAR O CARGA ──
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
            onClick={() => { setTipoFinal('CARGA'); setStep('carga_peligrosa') }}>
            Carga
          </Button>
          <Button size="xl" color="teal" variant="light" style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 20, borderRadius: 16 }}
            leftSection={<IconCarSuv size={24} />}
            onClick={() => { setTipoFinal('PARTICULAR'); setStep('advertencia_polarizados') }}>
            Particular
          </Button>
        </Group>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep('provincia')} size="sm">Volver</Button>
      </Box>
    </Box>
  )

  // ── CARGA PELIGROSA ──
  if (step === 'carga_peligrosa') return (
    <PantallaYesNo
      pregunta="¿El vehículo transporta carga peligrosa?"
      subtext="Combustibles, químicos, explosivos u otras sustancias de riesgo (ADR)"
      onSi={() => continuarDesdeCP(true)}
      onNo={() => continuarDesdeCP(false)}
      onVolver={() => {
        if (categoria === 'N1_PICKUP' && provinciaRestringida) setStep('provincia')
        else if (categoria === 'N1_PICKUP') setStep('n1_uso')
        else setStep('tipo_vehiculo')
      }}
    />
  )

  // ── PASAJEROS: TACÓGRAFO ──
  if (step === 'pasajeros_tacografo') return (
    <PantallaYesNo
      pregunta="¿El vehículo tiene tacógrafo instalado?"
      subtext="Obligatorio para vehículos de transporte de pasajeros"
      onSi={() => setStep('pasajeros_cedula_uso')}
      onNo={() => bloquear('Tacógrafo obligatorio', 'Los vehículos de pasajeros deben contar con tacógrafo instalado para poder realizar la RTO.')}
      onVolver={() => setStep('tipo_vehiculo')}
    />
  )

  // ── PASAJEROS: CÉDULA INDICA PASAJEROS ──
  if (step === 'pasajeros_cedula_uso') return (
    <PantallaYesNo
      pregunta="¿La cédula verde indica uso para transporte de pasajeros?"
      subtext="Debe estar especificado en el documento del vehículo"
      onSi={() => setStep('pasajeros_0km')}
      onNo={() => bloquear('La cédula debe indicar uso pasajeros', 'La cédula verde del vehículo debe indicar explícitamente el uso para transporte de pasajeros para poder realizar la RTO.')}
      onVolver={() => setStep('pasajeros_tacografo')}
    />
  )

  // ── PASAJEROS: 0 KM ──
  if (step === 'pasajeros_0km') return (
    <PantallaYesNo
      pregunta="¿El vehículo es 0 km (primera RTO)?"
      subtext="Los vehículos nuevos tienen una vigencia inicial especial"
      onSi={() => setStep('advertencia_polarizados')}
      onNo={() => setStep('advertencia_polarizados')}
      onVolver={() => setStep('pasajeros_cedula_uso')}
    />
  )

  // ── ADVERTENCIA POLARIZADOS ──
  if (step === 'advertencia_polarizados') return (
    <PantallaYesNo
      pregunta="¿El vehículo tiene vidrios polarizados?"
      subtext="Los polarizados deben retirarse antes de ingresar a la línea de inspección"
      onSi={() => setStep('advertencia_reflectivas')}
      onNo={() => setStep(tipoFinal === 'PARTICULAR' ? 'documentacion_cedula' : 'advertencia_reflectivas')}
      onVolver={() => {
        if (tipoFinal === 'PARTICULAR' && categoria === 'N1_SEDAN') setStep('provincia')
        else if (tipoFinal === 'PARTICULAR') setStep('n1_uso')
        else if (tipoFinal === 'PASAJEROS') setStep('pasajeros_0km')
        else setStep('carga_peligrosa')
      }}
    />
  )

  // ── ADVERTENCIA REFLECTIVAS (solo CARGA / PASAJEROS) ──
  if (step === 'advertencia_reflectivas') return (
    <PantallaYesNo
      pregunta="¿El vehículo cuenta con bandas reflectivas reglamentarias?"
      subtext="Requeridas para vehículos de carga y transporte según normativa DNRPA"
      onSi={() => setStep('documentacion_cedula')}
      onNo={() => setStep('documentacion_cedula')}
      onVolver={() => setStep('advertencia_polarizados')}
    />
  )

  // ── DOCUMENTACIÓN: CÉDULA VERDE ──
  if (step === 'documentacion_cedula') return (
    <PantallaYesNo
      pregunta="¿El conductor tiene la cédula verde del vehículo?"
      subtext="Es obligatoria para realizar la revisión técnica"
      onSi={() => continuarDesdeDocCedula()}
      onNo={() => bloquear('No puede realizar la revisión', 'La cédula verde del vehículo es obligatoria para realizar la RTO. Debe presentarla al momento de la inspección.')}
      onVolver={() => tipoFinal === 'PARTICULAR' ? setStep('advertencia_polarizados') : setStep('advertencia_reflectivas')}
    />
  )

  // ── DOCUMENTACIÓN: RTO ANTERIOR ──
  if (step === 'documentacion_rto') return (
    <PantallaYesNo
      pregunta="¿El vehículo tiene una RTO anterior para presentar?"
      subtext="Si ya tuvo RTO debe presentar el certificado anterior en el momento de la inspección"
      onSi={() => continuarDesdeDocRto()}
      onNo={() => continuarDesdeDocRto()}
      onVolver={() => setStep('documentacion_cedula')}
    />
  )

  // ── FACTURACIÓN: MISMO TITULAR ──
  if (step === 'facturacion_titular') return (
    <PantallaYesNo
      pregunta={vehiculo?.titular
        ? `¿Facturamos a ${vehiculo.titular}?`
        : '¿Facturamos al titular del vehículo?'}
      subtext={vehiculo?.cuit ? `CUIT ${vehiculo.cuit} · ${vehiculo.condicionIva}` : 'No hay datos previos de facturación'}
      onSi={() => continuarDesdeFact()}
      onNo={() => continuarDesdeFact()}
      onVolver={() => setStep('documentacion_rto')}
    />
  )

  // ── ADVERTENCIA VIGENCIA 4 MESES ──
  if (step === 'advertencia_vigencia') return (
    <PantallaYesNo
      pregunta="¿Entendés que la vigencia de tu RTO será de 4 meses?"
      subtext={tipoFinal === 'CARGA'
        ? 'Vehículos de carga con más de 10 años de antigüedad tienen vigencia reducida'
        : 'Vehículos de pasajeros con más de 10 años de antigüedad tienen vigencia reducida'}
      onSi={() => setStep('fecha_hora')}
      onNo={() => setStep('fecha_hora')}
      onVolver={() => setStep('facturacion_titular')}
    />
  )

  // ── FECHA Y HORA ──
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
              value={fecha}
              onChange={setFecha}
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
                      <Button
                        key={slot}
                        variant={hora === slot ? 'filled' : 'light'}
                        color={ocupado ? 'gray' : 'blue'}
                        disabled={ocupado}
                        size="sm"
                        onClick={() => setHora(slot)}
                      >
                        {slot}
                      </Button>
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
          onClick={() => vigencia === '4 meses' ? setStep('advertencia_vigencia') : setStep('facturacion_titular')}
          size="sm">
          Volver
        </Button>
      </Box>
    </Box>
  )

  // ── CONFIRMACIÓN ──
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
            <Text size="sm" fw={500}>
              {fecha ? dayjs(fecha).format('dddd DD/MM/YYYY') : ''} — {hora}
            </Text>
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
