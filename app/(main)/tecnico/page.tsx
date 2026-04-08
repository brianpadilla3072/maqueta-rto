'use client'
import { useState, useEffect } from 'react'
import {
  Stack, Title, Card, Group, Text, Badge, Button, ThemeIcon,
  SimpleGrid, Alert, Collapse, TextInput, Textarea, SegmentedControl, Drawer,
  Divider, Grid, ActionIcon, Tooltip, Modal,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconCar, IconCheck, IconX, IconAlertTriangle, IconPlayerPlay,
  IconClock, IconHistory, IconSearch, IconFileDescription,
  IconChevronDown, IconChevronUp,
} from '@tabler/icons-react'
import { colaInicial, vehiculos, type ColaItem, type EstadoCola, type Vehiculo } from '@/lib/mock'
import { ConfirmModal } from '@/components/ConfirmModal'

type ConfirmState = { action: () => void; title: string; message: string; color?: string } | null

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
            <Stack gap={0}>
              <Text size="xs" c="dimmed">{label}</Text>
              <Text size="xs" fw={500}
                c={
                  (label === 'Carga peligrosa' && v.peligrosa) ? 'red' :
                  (label === 'Condicional' && v.condicional) ? 'orange' :
                  undefined
                }
              >
                {valor}
              </Text>
            </Stack>
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
              <Badge size="xs" color={item.prioridad === 'CON_TURNO' ? 'teal' : 'blue'} variant="light">
                {item.prioridad === 'CON_TURNO' ? 'Con turno' : 'Turno en el día'}
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
  filtroDia: 'hoy' | 'mes' | 'todo'
  setFiltroDia: (v: 'hoy' | 'mes' | 'todo') => void
  busqueda: string
  setBusqueda: (v: string) => void
  colorResultado: Record<Resultado, string>
}) {
  return (
    <>
      <Stack px="md" pt="md" pb="sm" gap="sm">
        <SegmentedControl
          size="xs"
          fullWidth
          value={filtroDia}
          onChange={v => setFiltroDia(v as typeof filtroDia)}
          data={[
            { value: 'hoy',  label: 'Hoy' },
            { value: 'mes',  label: 'Mes' },
            { value: 'todo', label: 'Completo' },
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
      </Stack>

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
  const [filtroDia, setFiltroDia] = useState<'hoy' | 'mes' | 'todo'>('hoy')
  const [busqueda, setBusqueda]   = useState('')
  const [linea]  = useState(1)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [condicionalItem, setCondicionalItem] = useState<ColaItem | null>(null)
  const [motivo, setMotivo] = useState('')
  const tecnico = 'Carlos García'

  const pedir = (action: () => void, title: string, message: string, color?: string) =>
    setConfirm({ action, title, message, color })
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const avanzar = (id: string, nuevoEstado: EstadoCola) =>
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: nuevoEstado } : i))

  const finalizar = (item: ColaItem, resultado: Resultado, observacion?: string) => {
    avanzar(item.id, 'FINALIZADO')
    const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    setHistorial(prev => [{
      id: item.id + '-' + Date.now(),
      patente: item.patente,
      titular: item.titular,
      tipo: item.tipo,
      resultado,
      observacion,
      hora: horaActual,
      fecha: HOY,
    }, ...prev])
  }

  const confirmarCondicional = () => {
    if (!condicionalItem) return
    finalizar(condicionalItem, 'CONDICIONAL', motivo.trim() || undefined)
    setCondicionalItem(null)
    setMotivo('')
  }

  const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const histFiltrado = historial.filter(h => {
    const q = busqueda.trim().toLowerCase()
    if (q) return h.patente.toLowerCase().includes(q) || h.titular.toLowerCase().includes(q)
    if (filtroDia === 'hoy') return h.fecha === HOY
    if (filtroDia === 'mes') {
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      return h.fecha >= inicioMes
    }
    return true
  })

  const conObservacion = histFiltrado.filter(h => h.resultado !== 'APROBADO').length

  const histBtn = (
    <Tooltip label={`Historial${histFiltrado.length > 0 ? ` · ${histFiltrado.length} registros` : ''}`} withArrow>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <ActionIcon
          variant={histAbierto ? 'filled' : 'light'}
          color="blue"
          size="md"
          onClick={() => setHistAbierto(v => !v)}
        >
          <IconHistory size={16} />
        </ActionIcon>
        {conObservacion > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--mantine-color-orange-6)',
            color: '#fff', borderRadius: '50%',
            width: 14, height: 14,
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {conObservacion}
          </div>
        )}
      </div>
    </Tooltip>
  )

  const itemCards = cola.filter(i => i.estado !== 'FINALIZADO').map(item => (
    <ItemCard key={item.id} item={item}
      onAvanzar={(id, estado) => {
        const labels: Record<string, { title: string; msg: string }> = {
          INGRESO:     { title: 'Confirmar ingreso', msg: `¿Ingresar a ${item.patente} (${item.titular}) a la línea?` },
          EN_REVISION: { title: 'Iniciar revisión',  msg: `¿Iniciar la revisión de ${item.patente} (${item.titular})?` },
        }
        const l = labels[estado]
        if (l) pedir(() => avanzar(id, estado), l.title, l.msg)
        else avanzar(id, estado)
      }}
      onFinalizar={(it, resultado) => {
        if (resultado === 'CONDICIONAL') {
          setMotivo('')
          setCondicionalItem(it)
          return
        }
        const labels: Record<string, { title: string; msg: string; color: string }> = {
          APROBADO:  { title: 'Aprobar vehículo',  msg: `¿Aprobar la revisión de ${it.patente}?`,                                  color: 'green' },
          RECHAZADO: { title: 'Rechazar vehículo', msg: `¿Rechazar la revisión de ${it.patente}? El vehículo no aprueba la RTO.`, color: 'red'   },
        }
        const l = labels[resultado]
        pedir(() => finalizar(it, resultado), l.title, l.msg, l.color)
      }}
    />
  ))

  const historialDrawer = (
    <Drawer
      opened={histAbierto}
      onClose={() => setHistAbierto(false)}
      title="Historial del día"
      position={isDesktop ? 'right' : 'bottom'}
      size={isDesktop ? 400 : '90%'}
      styles={{ body: { padding: 0 } }}
    >
      <HistorialContent
        histFiltrado={histFiltrado}
        filtroDia={filtroDia}
        setFiltroDia={setFiltroDia}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        colorResultado={colorResultado}
      />
    </Drawer>
  )

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Técnico — Línea {linea}</Title>
        <Group gap="sm">
          <Text size="sm" c="dimmed">{tecnico} · {ahora}</Text>
          {histBtn}
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 3 }}>
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

      <Stack gap="md">
        {itemCards}
        {cola.filter(i => i.estado !== 'FINALIZADO').length === 0 && (
          <Alert icon={<IconCheck size={16} />} color="green" title="Cola vacía">
            No hay vehículos en cola por el momento.
          </Alert>
        )}
      </Stack>

      {historialDrawer}

      {/* Modal motivo condicional */}
      <Modal
        opened={condicionalItem !== null}
        onClose={() => setCondicionalItem(null)}
        title="Resultado condicional"
        centered
        size="sm"
      >
        <Stack>
          <Text size="sm">
            Ingresá el motivo del condicional para <b>{condicionalItem?.patente}</b>.
          </Text>
          <Textarea
            label="Motivo"
            placeholder="Ej: Luces defectuosas, frenos en mal estado..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            autosize
            minRows={3}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setCondicionalItem(null)}>Cancelar</Button>
            <Button color="orange" onClick={confirmarCondicional} disabled={!motivo.trim()}>
              Confirmar condicional
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.action ?? (() => {})}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmColor={confirm?.color}
      />
    </Stack>
  )
}

