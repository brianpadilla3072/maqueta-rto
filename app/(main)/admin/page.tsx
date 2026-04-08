'use client'
import { useState } from 'react'
import {
  Stack, Title, Tabs, Table, Badge, Button, Group, Text, Modal,
  Card, SimpleGrid, NumberInput, Alert,
} from '@mantine/core'
import {
  IconAlertTriangle, IconCash, IconUsers, IconLayoutList,
  IconCircleCheck, IconX,
} from '@tabler/icons-react'
import { condicionalesVencidos, cobrosIniciales, colaInicial, formatPesos, type Cobro } from '@/lib/mock'
import { ConfirmModal } from '@/components/ConfirmModal'

type ConfirmState = { action: () => void; title: string; message: string; color?: string } | null

export default function AdminPage() {
  const [condicionales, setCondicionales] = useState(condicionalesVencidos)
  const [cobros, setCobros] = useState<Cobro[]>(cobrosIniciales)
  const [modalCondicional, setModalCondicional] = useState<string | null>(null)
  const [cola] = useState(colaInicial)
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const pedir = (action: () => void, title: string, message: string, color?: string) =>
    setConfirm({ action, title, message, color })

  const forzarTurno = (id: string) => {
    setCondicionales(prev => prev.filter(c => c.id !== id))
    setModalCondicional(null)
  }

  const aprobar = (id: string) => setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'FACTURADO' as const } : c))
  const rechazar = (id: string) => setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'ANULADO' as const } : c))

  const pendientes = cobros.filter(c => c.estado === 'PENDIENTE_FACTURACION')

  const totalEfectivo = cobros.filter(c => c.estado === 'FACTURADO' && c.medio === 'Efectivo').reduce((a,b)=>a+b.monto,0)
  const totalPosnet   = cobros.filter(c => c.estado === 'FACTURADO' && c.medio === 'Posnet').reduce((a,b)=>a+b.monto,0)
  const totalTransf   = cobros.filter(c => c.estado === 'FACTURADO' && c.medio === 'Transferencia').reduce((a,b)=>a+b.monto,0)

  const selCondicional = condicionales.find(c => c.id === modalCondicional)

  return (
    <Stack maw={900} mx="auto">
      <Title order={2}>Admin</Title>

      <Tabs defaultValue="condicionales">
        <Tabs.List>
          <Tabs.Tab value="condicionales" leftSection={<IconAlertTriangle size={16} />}
            rightSection={condicionales.length > 0 ? <Badge size="xs" color="orange">{condicionales.length}</Badge> : null}>
            Condicionales
          </Tabs.Tab>
          <Tabs.Tab value="pagos" leftSection={<IconCash size={16} />}
            rightSection={pendientes.length > 0 ? <Badge size="xs" color="orange">{pendientes.length}</Badge> : null}>
            Pagos pendientes
          </Tabs.Tab>
          <Tabs.Tab value="cierre" leftSection={<IconCircleCheck size={16} />}>
            Cierre de caja
          </Tabs.Tab>
          <Tabs.Tab value="enlinea" leftSection={<IconLayoutList size={16} />}>
            En línea
          </Tabs.Tab>
        </Tabs.List>

        {/* ── CONDICIONALES ── */}
        <Tabs.Panel value="condicionales" pt="lg">
          <Title order={4} mb="md">Condicionales vencidos</Title>
          {condicionales.length === 0 ? (
            <Alert icon={<IconCircleCheck size={16} />} color="green">No hay condicionales vencidos.</Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Patente</Table.Th>
                  <Table.Th>Titular</Table.Th>
                  <Table.Th>Fecha condicional</Table.Th>
                  <Table.Th>Días transcurridos</Table.Th>
                  <Table.Th>Acción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {condicionales.map(c => (
                  <Table.Tr key={c.id}>
                    <Table.Td><Text ff="monospace" fw={600}>{c.patente}</Text></Table.Td>
                    <Table.Td>{c.titular}</Table.Td>
                    <Table.Td>{c.fechaCondicional}</Table.Td>
                    <Table.Td>
                      <Badge color={c.dias > 45 ? 'red' : 'orange'} variant="light">{c.dias} días</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button size="xs" color="orange" onClick={() => setModalCondicional(c.id)}>
                        Forzar turno
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        {/* ── PAGOS PENDIENTES ── */}
        <Tabs.Panel value="pagos" pt="lg">
          <Title order={4} mb="md">Transferencias pendientes</Title>
          {pendientes.length === 0 ? (
            <Alert icon={<IconCircleCheck size={16} />} color="green">No hay pagos pendientes.</Alert>
          ) : (
            <Table striped highlightOnHover>
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
                    <Table.Td><Text ff="monospace" size="sm">{c.patente}</Text></Table.Td>
                    <Table.Td>{c.titular}</Table.Td>
                    <Table.Td>{formatPesos(c.monto)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" color="green" leftSection={<IconCircleCheck size={14} />} onClick={() =>
                          pedir(
                            () => aprobar(c.id),
                            'Aprobar transferencia',
                            `¿Confirmar la acreditación de ${c.patente} — ${formatPesos(c.monto)}?`,
                            'green',
                          )
                        }>Aprobar</Button>
                        <Button size="xs" color="red" variant="light" leftSection={<IconX size={14} />} onClick={() =>
                          pedir(
                            () => rechazar(c.id),
                            'Rechazar pago',
                            `¿Rechazar el pago de ${c.patente}? Se registrará como anulado.`,
                            'red',
                          )
                        }>Rechazar</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        {/* ── CIERRE DE CAJA ── */}
        <Tabs.Panel value="cierre" pt="lg">
          <SimpleGrid cols={{ base:1, sm:3 }} mb="lg">
            {[
              { label: 'Efectivo', total: totalEfectivo, color: 'green' },
              { label: 'Posnet', total: totalPosnet, color: 'blue' },
              { label: 'Transferencia', total: totalTransf, color: 'violet' },
            ].map(({ label, total, color }) => (
              <Card key={label} withBorder>
                <Text size="xs" c="dimmed" mb={4}>{label}</Text>
                <Text size="xl" fw={700} c={color}>{formatPesos(total)}</Text>
                <NumberInput
                  label="Arqueo real"
                  prefix="$ "
                  thousandSeparator="."
                  decimalSeparator=","
                  defaultValue={total}
                  mt="sm"
                  size="sm"
                />
              </Card>
            ))}
          </SimpleGrid>
          <Card withBorder mb="md">
            <Group justify="space-between">
              <Text fw={600}>Total del día (cobrado)</Text>
              <Text fw={700} size="xl" c="green">{formatPesos(totalEfectivo + totalPosnet + totalTransf)}</Text>
            </Group>
          </Card>
          <Button color="green" leftSection={<IconCircleCheck size={16} />}>Cerrar caja</Button>
        </Tabs.Panel>

        {/* ── EN LÍNEA ── */}
        <Tabs.Panel value="enlinea" pt="lg">
          <Title order={4} mb="md">Vehículos activos en línea</Title>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Patente</Table.Th>
                <Table.Th>Titular</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Línea</Table.Th>
                <Table.Th>Prioridad</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {cola.map(item => (
                <Table.Tr key={item.id}>
                  <Table.Td><Text ff="monospace" fw={600}>{item.patente}</Text></Table.Td>
                  <Table.Td>{item.titular}</Table.Td>
                  <Table.Td>{item.tipo}</Table.Td>
                  <Table.Td>{item.linea}</Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={item.prioridad === 'CON_TURNO' ? 'teal' : 'blue'} variant="light">
                      {item.prioridad === 'CON_TURNO' ? 'Con turno' : 'Turno en el día'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={item.estado === 'EN_REVISION' ? 'green' : item.estado === 'EN_ESPERA' ? 'blue' : 'yellow'}>
                      {item.estado.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      {/* Modal forzar turno */}
      <Modal opened={modalCondicional !== null} onClose={() => setModalCondicional(null)} title="Forzar turno" centered>
        <Stack>
          <Alert icon={<IconAlertTriangle size={16} />} color="orange">
            Estás por forzar un turno de reverificación para <b>{selCondicional?.patente}</b> ({selCondicional?.titular}).
            El condicional tiene <b>{selCondicional?.dias} días</b> de vigencia.
          </Alert>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalCondicional(null)}>Cancelar</Button>
            <Button color="orange" onClick={() => forzarTurno(modalCondicional!)}>Confirmar</Button>
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
