'use client'
import { useState } from 'react'
import {
  Stack, Title, TextInput, Button, Group, Text, Badge,
  Divider, Table, Tabs, ScrollArea,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconSearch, IconCash, IconBuildingBank } from '@tabler/icons-react'
import { vehiculos, colaInicial, cobrosIniciales, formatPesos, type Cobro, type EstadoCobro, type ColaItem } from '@/lib/mock'
import { ConfirmModal } from '@/components/ConfirmModal'

type ConfirmState = { action: () => void; title: string; message: string; color?: string } | null

const precioDefault = (patente: string) => {
  const norm = (s: string) => s.replace(/\s/g, '').toUpperCase()
  const v = vehiculos.find(v => norm(v.patente) === norm(patente))
  return v ? (v.tipo === 'Carga' && v.peligrosa ? 15000 : 12000) : 12000
}

export default function CajaPage() {
  const [colaLocal, setColaLocal] = useState<ColaItem[]>(colaInicial)
  const [cobros, setCobros] = useState<Cobro[]>(cobrosIniciales)
  const [rango, setRango] = useState<[Date | null, Date | null]>([new Date(), new Date()])
  const [filtroPatente, setFiltroPatente] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const pedir = (action: () => void, title: string, message: string, color?: string) =>
    setConfirm({ action, title, message, color })

  const turnosPendientes = colaLocal.filter(t => t.medioPago === 'Efectivo')

  const registrarCobro = (turno: ColaItem) => {
    const nuevo: Cobro = {
      id: String(Date.now()),
      patente: turno.patente,
      titular: turno.titular,
      monto: precioDefault(turno.patente),
      medio: 'Efectivo',
      estado: 'PENDIENTE_FACTURACION' as EstadoCobro,
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toISOString().slice(0, 10),
    }
    setCobros(prev => [nuevo, ...prev])
    setColaLocal(prev => prev.filter(t => t.id !== turno.id))
  }

  const anularTurno = (turno: ColaItem) => {
    const nuevo: Cobro = {
      id: String(Date.now()),
      patente: turno.patente,
      titular: turno.titular,
      monto: precioDefault(turno.patente),
      medio: 'Efectivo',
      estado: 'ANULADO' as EstadoCobro,
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toISOString().slice(0, 10),
    }
    setCobros(prev => [nuevo, ...prev])
    setColaLocal(prev => prev.filter(t => t.id !== turno.id))
  }

  const facturarPago = (id: string) =>
    setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'FACTURADO' as EstadoCobro } : c))

  const anularPago = (id: string) =>
    setCobros(prev => prev.map(c => c.id === id ? { ...c, estado: 'ANULADO' as EstadoCobro } : c))

  const pendientes = cobros.filter(c => c.estado === 'PENDIENTE_FACTURACION')

  return (
    <Stack maw={900} mx="auto">
      <Title order={2}>Caja</Title>

      <Tabs defaultValue="cobro">
        <Tabs.List>
          <Tabs.Tab value="cobro" leftSection={<IconCash size={16} />}
            rightSection={turnosPendientes.length > 0 ? <Badge size="xs" color="green">{turnosPendientes.length}</Badge> : null}>
            Cobro
          </Tabs.Tab>
          <Tabs.Tab value="pagos" leftSection={<IconBuildingBank size={16} />}
            rightSection={pendientes.length > 0 ? <Badge size="xs" color="orange">{pendientes.length}</Badge> : null}>
            Pagos
          </Tabs.Tab>
        </Tabs.List>

        {/* ── COBRO ── */}
        <Tabs.Panel value="cobro" pt="lg">
          <Title order={4} mb="md">Turnos pendientes de cobro — Efectivo</Title>
          {turnosPendientes.length === 0 ? (
            <Text c="dimmed">No hay turnos pendientes de cobro en efectivo.</Text>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover style={{ minWidth: 500 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Patente</Table.Th>
                    <Table.Th>Titular</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Prioridad</Table.Th>
                    <Table.Th>Monto</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {turnosPendientes.map(t => (
                    <Table.Tr key={t.id}>
                      <Table.Td><Text ff="monospace" fw={600}>{t.patente}</Text></Table.Td>
                      <Table.Td>{t.titular}</Table.Td>
                      <Table.Td>{t.tipo}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={t.prioridad === 'CON_TURNO' ? 'teal' : 'blue'} variant="light">
                          {t.prioridad === 'CON_TURNO' ? 'Con turno' : 'Turno en el día'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatPesos(precioDefault(t.patente))}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button size="xs" color="green" onClick={() =>
                            pedir(
                              () => registrarCobro(t),
                              'Registrar cobro',
                              `Registrar cobro de ${t.patente} — ${formatPesos(precioDefault(t.patente))} en efectivo.`,
                              'green',
                            )
                          }>Registrar cobro</Button>
                          <Button size="xs" color="red" variant="light" onClick={() =>
                            pedir(
                              () => anularTurno(t),
                              'Anular cobro',
                              `¿Anular el turno de ${t.patente}? Se registrará como anulado en el historial.`,
                              'red',
                            )
                          }>Anular</Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Tabs.Panel>

        {/* ── PAGOS ── */}
        <Tabs.Panel value="pagos" pt="lg">
          <Title order={4} mb="md">Pagos pendientes de facturación</Title>
          {pendientes.length === 0 ? (
            <Text c="dimmed">No hay pagos pendientes de facturación.</Text>
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
                          <Button size="xs" color="blue" onClick={() =>
                            pedir(
                              () => facturarPago(c.id),
                              'Facturar pago',
                              `¿Facturar el pago de ${c.patente} — ${formatPesos(c.monto)}?`,
                              'blue',
                            )
                          }>Facturar</Button>
                          <Button size="xs" color="red" variant="light" onClick={() =>
                            pedir(
                              () => anularPago(c.id),
                              'Anular pago',
                              `¿Anular el pago de ${c.patente}? La acción no se puede deshacer.`,
                              'red',
                            )
                          }>Anular</Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          <Divider my="lg" label="Historial" />
          <Group mb="sm" gap="sm" align="flex-end">
            <DatePickerInput
              type="range"
              label="Período"
              value={rango}
              onChange={setRango}
              valueFormat="DD/MM/YYYY"
              style={{ width: 240 }}
            />
            <TextInput
              label="Patente"
              placeholder="ABC 123"
              value={filtroPatente}
              onChange={e => setFiltroPatente(e.target.value.toUpperCase())}
              leftSection={<IconSearch size={14} />}
              style={{ flex: 1 }}
              styles={{ input: { fontFamily: 'monospace' } }}
            />
          </Group>
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
                {cobros
                  .filter(c => {
                    const f = new Date(c.fecha + 'T00:00:00')
                    return (
                      (!rango[0] || f >= rango[0]) &&
                      (!rango[1] || f <= rango[1]) &&
                      (!filtroPatente || c.patente.replace(/\s/g,'').includes(filtroPatente.replace(/\s/g,'')))
                    )
                  })
                  .map(c => (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.hora}</Table.Td>
                    <Table.Td><Text ff="monospace" size="sm">{c.patente}</Text></Table.Td>
                    <Table.Td>{c.titular}</Table.Td>
                    <Table.Td>{formatPesos(c.monto)}</Table.Td>
                    <Table.Td>{c.medio}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={
                        c.estado === 'FACTURADO' ? 'blue' :
                        c.estado === 'PENDIENTE_FACTURACION' ? 'orange' : 'red'
                      }>
                        {c.estado === 'FACTURADO' ? 'Facturado' :
                         c.estado === 'PENDIENTE_FACTURACION' ? 'Pend. factura' : 'Anulado'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

      </Tabs>

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
