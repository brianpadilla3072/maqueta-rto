'use client'
import { useState } from 'react'
import {
  Stack, Title, TextInput, Button, Group, Card, Text, Badge,
  SimpleGrid, ThemeIcon, Alert, Divider, NumberInput, Radio,
  Modal, Table, Tabs, ScrollArea,
} from '@mantine/core'
import {
  IconSearch, IconUser, IconCar, IconCash, IconAlertTriangle,
  IconCircleCheck, IconBuildingBank,
} from '@tabler/icons-react'
import { vehiculos, cobrosIniciales, formatPesos, type Cobro } from '@/lib/mock'

type MedioPago = 'Efectivo' | 'Posnet' | 'Transferencia'

const precioDefault = (v: typeof vehiculos[0]) =>
  v.tipo === 'Carga' && v.peligrosa ? 15000 : 12000

export default function CajaPage() {
  const [patente, setPatente] = useState('')
  const [vehiculo, setVehiculo] = useState<typeof vehiculos[0] | null>(null)
  const [monto, setMonto] = useState<number | string>(0)
  const [medio, setMedio] = useState<MedioPago>('Efectivo')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [ticketVisible, setTicketVisible] = useState(false)
  const [cobros, setCobros] = useState<Cobro[]>(cobrosIniciales)

  const buscar = () => {
    const norm = (s: string) => s.replace(/\s/g, '').toUpperCase()
    const v = vehiculos.find(v => norm(v.patente) === norm(patente))
    if (v) { setVehiculo(v); setMonto(precioDefault(v)) }
    else setVehiculo(null)
  }

  const registrarCobro = () => {
    const nuevo: Cobro = {
      id: String(Date.now()),
      patente: vehiculo!.patente,
      titular: vehiculo!.titular,
      monto: Number(monto),
      medio,
      estado: medio === 'Transferencia' ? 'PENDIENTE_VALIDACION' : 'PAGADO',
      hora: new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }),
    }
    setCobros(prev => [nuevo, ...prev])
    setModalAbierto(false)
    setTicketVisible(true)
  }

  const aprobarTransferencia = (id: string) =>
    setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'PAGADO' } : c))

  const rechazarTransferencia = (id: string) =>
    setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'RECHAZADO' } : c))

  const pendientes = cobros.filter(c => c.estado === 'PENDIENTE_VALIDACION')
  const totalEfectivo = cobros.filter(c => c.estado === 'PAGADO' && c.medio === 'Efectivo').reduce((a,b)=>a+b.monto,0)
  const totalPosnet = cobros.filter(c => c.estado === 'PAGADO' && c.medio === 'Posnet').reduce((a,b)=>a+b.monto,0)
  const totalTransferencia = cobros.filter(c => c.estado === 'PAGADO' && c.medio === 'Transferencia').reduce((a,b)=>a+b.monto,0)

  return (
    <Stack maw={900} mx="auto">
      <Title order={2}>Caja</Title>

      <Tabs defaultValue="cobro">
        <Tabs.List>
          <Tabs.Tab value="cobro" leftSection={<IconCash size={16} />}>Cobro</Tabs.Tab>
          <Tabs.Tab value="transferencias" leftSection={<IconBuildingBank size={16} />}
            rightSection={pendientes.length > 0 ? <Badge size="xs" color="orange">{pendientes.length}</Badge> : null}>
            Transferencias
          </Tabs.Tab>
        </Tabs.List>

        {/* ── COBRO ── */}
        <Tabs.Panel value="cobro" pt="lg">
          <Group align="flex-end" mb="lg">
            <TextInput
              label="Patente"
              placeholder="ABC 123"
              value={patente}
              onChange={e => setPatente(e.target.value.toUpperCase())}
              style={{ flex:1 }}
              styles={{ input: { fontFamily:'monospace', fontSize: 18, letterSpacing: 3 } }}
            />
            <Button leftSection={<IconSearch size={16} />} onClick={buscar} disabled={patente.length < 6}>
              Buscar
            </Button>
          </Group>

          {vehiculo && (
            <SimpleGrid cols={{ base:1, sm:2 }} spacing="lg">
              <Stack gap="md">
                <Card withBorder>
                  <Group mb="xs">
                    <ThemeIcon variant="light"><IconUser size={16} /></ThemeIcon>
                    <div>
                      <Text fw={600}>{vehiculo.titular || 'Sin historial'}</Text>
                      <Text size="xs" c="dimmed">{vehiculo.cuit} · {vehiculo.condicionIva}</Text>
                    </div>
                  </Group>
                  <SimpleGrid cols={2} mt="sm">
                    <div><Text size="xs" c="dimmed">Tipo</Text><Text size="sm" fw={500}>{vehiculo.tipo}</Text></div>
                    <div><Text size="xs" c="dimmed">Año</Text><Text size="sm" fw={500}>{vehiculo.anio}</Text></div>
                    <div><Text size="xs" c="dimmed">Jurisdicción</Text><Text size="sm" fw={500}>{vehiculo.jurisdiccion}</Text></div>
                    <div><Text size="xs" c="dimmed">Vencimiento</Text><Text size="sm" fw={500}>{vehiculo.vencimiento}</Text></div>
                  </SimpleGrid>
                  <Badge mt="sm" color={vehiculo.condicional ? 'orange' : 'green'} variant="light">
                    {vehiculo.condicional ? 'CONDICIONAL' : 'TURNO CONFIRMADO'}
                  </Badge>
                </Card>

                {vehiculo.condicional && (
                  <Alert icon={<IconAlertTriangle size={16} />} color="orange" title="Condicional activo">
                    El vehículo tiene un condicional de {vehiculo.diasCondicional} días. Verificar resolución antes de cobrar.
                  </Alert>
                )}
              </Stack>

              <Stack gap="md">
                <Card withBorder>
                  <Text fw={600} mb="md">Registrar cobro</Text>
                  <NumberInput
                    label="Monto"
                    value={monto}
                    onChange={setMonto}
                    prefix="$ "
                    thousandSeparator="."
                    decimalSeparator=","
                    mb="md"
                  />
                  <Radio.Group label="Medio de pago" value={medio} onChange={(v) => setMedio(v as MedioPago)} mb="lg">
                    <Stack gap="xs" mt="xs">
                      <Radio value="Efectivo" label="Efectivo" />
                      <Radio value="Posnet" label="Posnet / débito" />
                      <Radio value="Transferencia" label="Transferencia bancaria" />
                    </Stack>
                  </Radio.Group>
                  {medio === 'Transferencia' && (
                    <Alert color="blue" mb="md" fz="xs">
                      La transferencia quedará pendiente de validación hasta que confirmes la acreditación.
                    </Alert>
                  )}
                  <Button fullWidth color="green" onClick={() => setModalAbierto(true)}>
                    Registrar cobro
                  </Button>
                </Card>

                {ticketVisible && (
                  <Card withBorder bg="green.0">
                    <Group>
                      <ThemeIcon color="green" variant="light"><IconCircleCheck size={16} /></ThemeIcon>
                      <div>
                        <Text fw={600} size="sm">Cobro registrado</Text>
                        <Text size="xs" c="dimmed">{vehiculo.patente} — {formatPesos(Number(monto))} — {medio}</Text>
                      </div>
                    </Group>
                  </Card>
                )}
              </Stack>
            </SimpleGrid>
          )}

          {!vehiculo && patente.length >= 6 && (
            <Alert color="red" icon={<IconAlertTriangle size={16} />}>
              Patente no encontrada en el sistema.
            </Alert>
          )}
        </Tabs.Panel>

        {/* ── TRANSFERENCIAS ── */}
        <Tabs.Panel value="transferencias" pt="lg">
          <Title order={4} mb="md">Transferencias pendientes de validación</Title>
          {pendientes.length === 0 ? (
            <Text c="dimmed">No hay transferencias pendientes.</Text>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover style={{ minWidth: 500 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Hora</Table.Th>
                    <Table.Th>Patente</Table.Th>
                    <Table.Th>Titular</Table.Th>
                    <Table.Th>Monto</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendientes.map(c => (
                    <Table.Tr key={c.id}>
                      <Table.Td>{c.hora}</Table.Td>
                      <Table.Td><Text ff="monospace" fw={600}>{c.patente}</Text></Table.Td>
                      <Table.Td>{c.titular}</Table.Td>
                      <Table.Td>{formatPesos(c.monto)}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button size="xs" color="green" onClick={() => aprobarTransferencia(c.id)}>Aprobar</Button>
                          <Button size="xs" color="red" variant="light" onClick={() => rechazarTransferencia(c.id)}>Rechazar</Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          <Divider my="lg" label="Historial del día" />
          <ScrollArea>
            <Table style={{ minWidth: 560 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hora</Table.Th>
                  <Table.Th>Patente</Table.Th>
                  <Table.Th>Titular</Table.Th>
                  <Table.Th>Monto</Table.Th>
                  <Table.Th>Medio</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {cobros.map(c => (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.hora}</Table.Td>
                    <Table.Td><Text ff="monospace" size="sm">{c.patente}</Text></Table.Td>
                    <Table.Td>{c.titular}</Table.Td>
                    <Table.Td>{formatPesos(c.monto)}</Table.Td>
                    <Table.Td>{c.medio}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={c.estado === 'PAGADO' ? 'green' : c.estado === 'PENDIENTE_VALIDACION' ? 'orange' : 'red'}>
                        {c.estado === 'PAGADO' ? 'Pagado' : c.estado === 'PENDIENTE_VALIDACION' ? 'Pendiente' : 'Rechazado'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

      </Tabs>

      {/* Modal confirmación cobro */}
      <Modal opened={modalAbierto} onClose={() => setModalAbierto(false)} title="Confirmar cobro" centered>
        <Stack>
          <Text>¿Confirmar el siguiente cobro?</Text>
          <Card withBorder>
            <Text size="sm"><b>Patente:</b> {vehiculo?.patente}</Text>
            <Text size="sm"><b>Titular:</b> {vehiculo?.titular}</Text>
            <Text size="sm"><b>Monto:</b> {formatPesos(Number(monto))}</Text>
            <Text size="sm"><b>Medio:</b> {medio}</Text>
          </Card>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button color="green" onClick={registrarCobro}>Confirmar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
