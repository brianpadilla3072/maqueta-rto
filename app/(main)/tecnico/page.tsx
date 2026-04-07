'use client'
import { useState, useEffect } from 'react'
import {
  Stack, Title, Card, Group, Text, Badge, Button, ThemeIcon,
  SimpleGrid, Alert, Collapse, TextInput, SegmentedControl,
  Divider, Grid, Transition,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconCar, IconCheck, IconX, IconAlertTriangle, IconPlayerPlay,
  IconClock, IconHistory, IconSearch, IconChevronDown, IconChevronUp,
  IconFileDescription,
} from '@tabler/icons-react'
import { colaInicial, vehiculos, type ColaItem, type EstadoCola, type Vehiculo } from '@/lib/mock'

// ── Tipos ──────────────────────────────────────────────────────────
type Resultado = 'APROBADO' | 'CONDICIONAL' | 'RECHAZADO'

interface HistorialItem {
  id: string
  patente: string
  titular: string
  tipo: string
  resultado: Resultado
  observacion?: string
  hora: string
  fecha: string
}

// ── Mock historial ─────────────────────────────────────────────────
const HOY  = new Date().toISOString().slice(0, 10)
const AYER = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

const historialMock: HistorialItem[] = [
  { id: 'h1', patente: 'STU 901', titular: 'Luis Fernández',  tipo: 'Carga común',    resultado: 'APROBADO',    hora: '08:15', fecha: HOY },
  { id: 'h2', patente: 'VWX 234', titular: 'Ana Gómez',       tipo: 'Particular',      resultado: 'CONDICIONAL', hora: '08:40', fecha: HOY,  observacion: 'Luces defectuosas' },
  { id: 'h3', patente: 'YZA 567', titular: 'Pedro Martínez',  tipo: 'Carga peligrosa', resultado: 'RECHAZADO',   hora: '09:00', fecha: HOY,  observacion: 'Frenos en mal estado' },
  { id: 'h4', patente: 'BCD 890', titular: 'Hugo Castillo',   tipo: 'Carga común',    resultado: 'APROBADO',    hora: '10:10', fecha: AYER },
  { id: 'h5', patente: 'EFG 123', titular: 'Norma Ríos',      tipo: 'Particular',      resultado: 'APROBADO',    hora: '10:35', fecha: AYER },
  { id: 'h6', patente: 'ABC 999', titular: 'Martín Sosa',     tipo: 'Carga común',    resultado: 'CONDICIONAL', hora: '14:20', fecha: AYER, observacion: 'Polarizados excesivos' },
]

// ── Colores ────────────────────────────────────────────────────────
const colorEstado: Record<EstadoCola, string> = {
  EN_ESPERA: 'blue', INGRESO: 'yellow', EN_REVISION: 'teal', FINALIZADO: 'gray',
}
const labelEstado: Record<EstadoCola, string> = {
  EN_ESPERA: 'En espera', INGRESO: 'Ingresó a línea', EN_REVISION: 'En revisión', FINALIZADO: 'Finalizado',
}
const colorResultado: Record<Resultado, string> = {
  APROBADO: 'green', CONDICIONAL: 'orange', RECHAZADO: 'red',
}

// ── Cronómetro ────────────────────────────────────────────────────
function Cronometro({ activo }: { activo: boolean }) {
  const [seg, setSeg] = useState(0)
  useEffect(() => {
    if (!activo) { setSeg(0); return }
    const id = setInterval(() => setSeg(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [activo])
  if (!activo) return null
  const mm = String(Math.floor(seg / 60)).padStart(2, '0')
  const ss = String(seg % 60).padStart(2, '0')
  return (
    <Group gap={4}>
      <IconClock size={14} />
      <Text size="xs" ff="monospace">{mm}:{ss}</Text>
    </Group>
  )
}

// ── Ficha del vehículo desplegable ────────────────────────────────
function FichaVehiculo({ v }: { v: Vehiculo }) {
  const campos: [string, string][] = [
    ['CUIT',            v.cuit],
    ['Condición IVA',   v.condicionIva],
    ['Tipo',            v.tipo],
    ['Carga peligrosa', v.peligrosa ? 'Sí' : 'No'],
    ['Año',             String(v.anio)],
    ['Jurisdicción',    v.jurisdiccion],
    ['Última revisión', v.ultimaRevision],
    ['Vencimiento',     v.vencimiento],
    ['Condicional',     v.condicional ? `Sí (${v.diasCondicional ?? '?'} días)` : 'No'],
  ]
  return (
    <Stack gap={0} pt="sm">
      <Divider mb="sm" label={
        <Group gap={4}>
          <IconFileDescription size={12} />
          <Text size="xs" fw={600} tt="uppercase" c="dimmed">Ficha del vehículo</Text>
        </Group>
      } />
      <Grid gutter="xs">
        {campos.map(([label, valor]) => (
          <Grid.Col key={label} span={6}>
            <Group gap={4} wrap="nowrap">
              <Text size="xs" c="dimmed" style={{ minWidth: 110, flexShrink: 0 }}>{label}:</Text>
              <Text size="xs" fw={500}
                c={
                  (label === 'Carga peligrosa' && v.peligrosa) ? 'red' :
                  (label === 'Condicional' && v.condicional) ? 'orange' :
                  undefined
                }
              >
                {valor}
              </Text>
            </Group>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  )
}

// ── Tarjeta de ítem de cola ────────────────────────────────────────
function ItemCard({
  item,
  onAvanzar,
  onFinalizar,
}: {
  item: ColaItem
  onAvanzar: (id: string, estado: EstadoCola) => void
  onFinalizar: (item: ColaItem, resultado: Resultado) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const vehiculo = vehiculos.find(v => v.patente.replace(/\s/g,'') === item.patente.replace(/\s/g,''))

  return (
    <Card withBorder shadow="sm">
      <Group justify="space-between" align="flex-start">
        <Group gap="sm">
          <ThemeIcon variant="light" color={colorEstado[item.estado]} size="lg">
            <IconCar size={18} />
          </ThemeIcon>
          <div>
            <Text fw={700} ff="monospace" size="lg" style={{ letterSpacing: 3 }}>
              {item.patente}
            </Text>
            <Text size="xs" c="dimmed">{item.titular} · {item.tipo}</Text>
            <Group gap="xs" mt={2}>
              <Badge size="xs" color={item.prioridad === 'CON_TURNO' ? 'teal' : 'gray'} variant="light">
                {item.prioridad === 'CON_TURNO' ? 'Con turno' : 'Sin turno'}
              </Badge>
              <Badge size="xs" color={colorEstado[item.estado]} variant="light">
                {labelEstado[item.estado]}
              </Badge>
              <Cronometro activo={item.estado === 'EN_REVISION'} />
            </Group>
          </div>
        </Group>

        <Stack gap="xs" align="flex-end">
          {item.estado === 'EN_ESPERA' && (
            <Button size="xs" color="yellow" variant="light"
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => onAvanzar(item.id, 'INGRESO')}>
              Ingresó a línea
            </Button>
          )}
          {item.estado === 'INGRESO' && (
            <Button size="xs" color="teal"
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => onAvanzar(item.id, 'EN_REVISION')}>
              Iniciar revisión
            </Button>
          )}
          {item.estado === 'EN_REVISION' && (
            <Group gap="xs">
              <Button size="xs" color="green" leftSection={<IconCheck size={14} />}
                onClick={() => onFinalizar(item, 'APROBADO')}>
                Aprobado
              </Button>
              <Button size="xs" color="orange" variant="light" leftSection={<IconAlertTriangle size={14} />}
                onClick={() => onFinalizar(item, 'CONDICIONAL')}>
                Condicional
              </Button>
              <Button size="xs" color="red" variant="light" leftSection={<IconX size={14} />}
                onClick={() => onFinalizar(item, 'RECHAZADO')}>
                Rechazado
              </Button>
            </Group>
          )}

          {/* Toggle ficha */}
          <Button
            size="xs" variant="subtle" color="gray"
            rightSection={abierto ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            onClick={() => setAbierto(v => !v)}
          >
            {abierto ? 'Ocultar ficha' : 'Ver ficha'}
          </Button>
        </Stack>
      </Group>

      {/* Ficha desplegable */}
      <Collapse in={abierto}>
        {vehiculo
          ? <FichaVehiculo v={vehiculo} />
          : (
            <Text size="xs" c="dimmed" pt="sm" ta="center">
              Sin historial registrado en el sistema
            </Text>
          )
        }
      </Collapse>
    </Card>
  )
}

// ── HistorialContent ──────────────────────────────────────────────
function HistorialContent({
  histFiltrado,
  filtroDia,
  setFiltroDia,
  busqueda,
  setBusqueda,
  colorResultado,
}: {
  histFiltrado: HistorialItem[]
  filtroDia: 'hoy' | 'ayer' | 'semana'
  setFiltroDia: (v: 'hoy' | 'ayer' | 'semana') => void
  busqueda: string
  setBusqueda: (v: string) => void
  colorResultado: Record<Resultado, string>
}) {
  return (
    <>
      <Group px="md" pt="md" pb="sm" gap="sm" wrap="wrap">
        <SegmentedControl
          size="xs"
          value={filtroDia}
          onChange={v => setFiltroDia(v as typeof filtroDia)}
          data={[
            { value: 'hoy',    label: 'Hoy' },
            { value: 'ayer',   label: 'Ayer' },
            { value: 'semana', label: 'Últimos 7 días' },
          ]}
        />
        <TextInput
          size="xs"
          placeholder="Buscar patente o titular..."
          leftSection={<IconSearch size={13} />}
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
      </Group>

      <Stack gap={0} px="md" pb="md">
        {histFiltrado.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">Sin registros para el filtro seleccionado.</Text>
        ) : histFiltrado.map((h, i) => (
          <div key={h.id}>
            {i > 0 && <Divider my={0} />}
            <Group justify="space-between" py="xs" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <ThemeIcon size="sm" radius="xl" variant="light" color={colorResultado[h.resultado]}>
                  {h.resultado === 'APROBADO'
                    ? <IconCheck size={11} />
                    : h.resultado === 'CONDICIONAL'
                      ? <IconAlertTriangle size={11} />
                      : <IconX size={11} />
                  }
                </ThemeIcon>
                <div style={{ minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap">
                    <Text ff="monospace" size="sm" fw={600} style={{ letterSpacing: 2 }}>{h.patente}</Text>
                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>{h.titular}</Text>
                  </Group>
                  {h.observacion && (
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>{h.observacion}</Text>
                  )}
                </div>
              </Group>
              <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                <Badge size="xs" color={colorResultado[h.resultado]} variant="light">{h.resultado}</Badge>
                <Text size="xs" c="dimmed" ff="monospace">{h.hora}</Text>
              </Group>
            </Group>
          </div>
        ))}
      </Stack>
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function TecnicoPage() {
  const [cola, setCola]           = useState<ColaItem[]>(colaInicial.filter(i => i.linea === 1))
  const [historial, setHistorial] = useState<HistorialItem[]>(historialMock)
  const [histAbierto, setHistAbierto] = useState(false)
  const [filtroDia, setFiltroDia] = useState<'hoy' | 'ayer' | 'semana'>('hoy')
  const [busqueda, setBusqueda]   = useState('')
  const [linea]  = useState(1)
  const tecnico = 'Carlos García'
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const avanzar = (id: string, nuevoEstado: EstadoCola) =>
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: nuevoEstado } : i))

  const finalizar = (item: ColaItem, resultado: Resultado) => {
    avanzar(item.id, 'FINALIZADO')
    const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    setHistorial(prev => [{
      id: item.id + '-' + Date.now(),
      patente: item.patente,
      titular: item.titular,
      tipo: item.tipo,
      resultado,
      hora: horaActual,
      fecha: HOY,
    }, ...prev])
  }

  const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const histFiltrado = historial.filter(h => {
    const q = busqueda.trim().toLowerCase()
    if (q && !h.patente.toLowerCase().includes(q) && !h.titular.toLowerCase().includes(q)) return false
    if (filtroDia === 'hoy')   return h.fecha === HOY
    if (filtroDia === 'ayer')  return h.fecha === AYER
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    return h.fecha >= hace7
  })

  const conObservacion = histFiltrado.filter(h => h.resultado !== 'APROBADO').length

  // ── Contenido de columna izquierda ────────────────────────────
  const leftCol = (
    <Stack gap="md" style={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}>
      <Group justify="space-between" align="center">
        <Title order={2}>Técnico — Línea {linea}</Title>
        <Text size="sm" c="dimmed">{tecnico} · {ahora}</Text>
      </Group>

      {/* KPIs */}
      <SimpleGrid cols={3}>
        {(['EN_ESPERA', 'EN_REVISION', 'FINALIZADO'] as EstadoCola[]).map(e => {
          const n = cola.filter(i => i.estado === e).length
          return (
            <Card key={e} withBorder ta="center" py="xs">
              <Text size="xl" fw={700} c={colorEstado[e]}>{n}</Text>
              <Text size="xs" c="dimmed">{labelEstado[e]}</Text>
            </Card>
          )
        })}
      </SimpleGrid>

      {/* Cola activa */}
      <Stack gap="md">
        {cola.filter(i => i.estado !== 'FINALIZADO').map(item => (
          <ItemCard key={item.id} item={item} onAvanzar={avanzar} onFinalizar={finalizar} />
        ))}

        {cola.filter(i => i.estado !== 'FINALIZADO').length === 0 && (
          <Alert icon={<IconCheck size={16} />} color="green" title="Cola vacía">
            No hay vehículos en cola por el momento.
          </Alert>
        )}
      </Stack>

      {!isDesktop && <Divider />}

      {/* Header del historial — siempre visible en izquierda */}
      <Card withBorder radius="lg" p={0}>
        <Group
          justify="space-between"
          px="md" py="sm"
          style={{ cursor: 'pointer' }}
          onClick={() => setHistAbierto(v => !v)}
        >
          <Group gap="sm">
            <IconHistory size={18} />
            <Text fw={600}>Historial del día</Text>
            {conObservacion > 0 && (
              <Badge size="xs" color="orange" variant="light">
                {conObservacion} con observación
              </Badge>
            )}
            <Badge size="xs" color="gray" variant="light">
              {histFiltrado.length} registros
            </Badge>
          </Group>
          {isDesktop ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconChevronDown
                size={16}
                style={{
                  transform: histAbierto ? 'rotate(-90deg)' : 'rotate(90deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
          ) : histAbierto ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </Group>

        {/* Collapse para mobile */}
        {!isDesktop && (
          <Collapse in={histAbierto}>
            <Divider />
            <HistorialContent
              histFiltrado={histFiltrado}
              filtroDia={filtroDia}
              setFiltroDia={setFiltroDia}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              colorResultado={colorResultado}
            />
          </Collapse>
        )}
      </Card>
    </Stack>
  )

  // ── Layout condicional ────────────────────────────────────────
  if (!isDesktop) {
    return <Stack maw={700} mx="auto">{leftCol}</Stack>
  }

  // Desktop: layout horizontal con panel derecho
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '24px' }}>
      {leftCol}

      {/* Panel derecho — aparece cuando histAbierto */}
      <Transition mounted={histAbierto} transition="slide-left" duration={200} timingFunction="ease">
        {styles => (
          <div
            style={{
              width: 360,
              flexShrink: 0,
              ...styles,
            }}
          >
            <Card withBorder radius="lg" p={0}>
              <Divider />
              <HistorialContent
                histFiltrado={histFiltrado}
                filtroDia={filtroDia}
                setFiltroDia={setFiltroDia}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                colorResultado={colorResultado}
              />
            </Card>
          </div>
        )}
      </Transition>
    </div>
  )
}
