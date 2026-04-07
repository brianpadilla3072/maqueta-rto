'use client'
import { useState } from 'react'
import {
  Stack, Title, Tabs, Table, Text, Alert, Badge, Group, SimpleGrid, ScrollArea, Card, Button, Modal, TextInput, NumberInput,
} from '@mantine/core'
import {
  IconCurrencyDollar, IconClock, IconTruck, IconUsers, IconInfoCircle, IconAlertTriangle, IconPlus, IconCalendar,
} from '@tabler/icons-react'
import { preciosIniciales, usuariosIniciales } from '@/lib/mock'

const diasHabiles = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const apertura = '08:00'
const cierre = '17:00'
const lineas = [
  { id: 1, nombre: 'Línea 1', capacidad: 8, activa: true },
  { id: 2, nombre: 'Línea 2', capacidad: 6, activa: true },
]

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const condicionalesIniciales = [
  { id: 1, placa: 'GHI 789', propietario: 'Carlos Rodríguez', diasVencidos: 35 },
  { id: 2, placa: 'HIJ 456', propietario: 'Miguel Ángel López', diasVencidos: 49 },
]

export default function ConfigPage() {
  const [condicionales, setCondicionales] = useState(condicionalesIniciales)

  const handleEliminar = (id: number) => {
    setCondicionales(condicionales.filter(c => c.id !== id))
  }

  return (
    <Stack maw={860} mx="auto">
      <Title order={2}>Administración</Title>


      <Tabs defaultValue="precios">
        <Tabs.List>
          <Tabs.Tab value="observados" leftSection={<IconCalendar size={16} />}>Observados</Tabs.Tab>
          <Tabs.Tab value="precios"  leftSection={<IconCurrencyDollar size={16} />}>Precios</Tabs.Tab>
          <Tabs.Tab value="horarios" leftSection={<IconClock size={16} />}>Horarios</Tabs.Tab>
          <Tabs.Tab value="lineas"   leftSection={<IconTruck size={16} />}>Líneas</Tabs.Tab>
          <Tabs.Tab value="usuarios" leftSection={<IconUsers size={16} />}>Usuarios</Tabs.Tab>
        </Tabs.List>

        {/* ── OBSERVADOS ── */}
        <Tabs.Panel value="observados" pt="lg">
          <Title order={4} mb="md">Vehículos observados</Title>
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mb="lg">
            Los observados tienen 30 días para presentarse. Forzar turno renueva el plazo.
          </Alert>

          {condicionales.length > 0 && (
            <Card withBorder p="lg" style={{ backgroundColor: '#fffaf0', borderColor: '#fed7aa' }}>
              <Group mb="md" gap="sm" align="flex-start">
                <IconAlertTriangle size={16} color="#ea580c" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text fw={600} size="sm" c="#ea580c">Condicionales vencidos — requieren atención</Text>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {condicionales.map(c => (
                  <div key={c.id} style={{ backgroundColor: '#fff', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px' }}>
                    <Group justify="space-between" gap="md" mb="xs">
                      <div>
                        <Text fw={700} size="sm" style={{ fontFamily: 'monospace' }}>{c.placa}</Text>
                        <Text size="xs" c="dimmed">{c.propietario}</Text>
                      </div>
                      <Badge size="sm" variant="light" color="orange">{c.diasVencidos} días</Badge>
                    </Group>
                    <Group gap="xs">
                      <Button variant="light" color="blue" size="xs" style={{ flex: 1 }} onClick={() => {
                        setCondicionales(prev => prev.map(x => x.id === c.id ? { ...x, diasVencidos: 0 } : x))
                      }}>
                        Forzar turno
                      </Button>
                      <Button variant="subtle" color="red" size="xs" onClick={() => handleEliminar(c.id)}>
                        Remover
                      </Button>
                    </Group>
                  </div>
                ))}
              </SimpleGrid>
            </Card>
          )}

          {condicionales.length === 0 && (
            <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
              No hay vehículos observados en este momento.
            </Alert>
          )}
        </Tabs.Panel>

        {/* ── PRECIOS ── */}
        <Tabs.Panel value="precios" pt="lg">
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mb="lg">
            Esta pantalla es solo de consulta. Para modificar la configuración, accedé al sistema Marino.
          </Alert>
          <Title order={4} mb="md">Precios por tipo de vehículo</Title>
          <ScrollArea>
            <Table striped style={{ minWidth: 280 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Precio</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(preciosIniciales).map(([tipo, valor]) => (
                  <Table.Tr key={tipo}>
                    <Table.Td>{tipo}</Table.Td>
                    <Table.Td><Text fw={500}>{formatPrecio(valor)}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        {/* ── HORARIOS ── */}
        <Tabs.Panel value="horarios" pt="lg">
          <Title order={4} mb="md">Días y horarios de atención</Title>
          <Stack gap="lg">
            <div>
              <Text fw={500} mb="sm">Días hábiles</Text>
              <Group gap="xs">
                {diasHabiles.map(d => (
                  <Badge key={d} variant="light" color="blue">{d}</Badge>
                ))}
              </Group>
            </div>
            <SimpleGrid cols={2}>
              <div>
                <Text fw={500} mb={4}>Apertura</Text>
                <Text c="dimmed">{apertura}</Text>
              </div>
              <div>
                <Text fw={500} mb={4}>Cierre</Text>
                <Text c="dimmed">{cierre}</Text>
              </div>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        {/* ── LÍNEAS ── */}
        <Tabs.Panel value="lineas" pt="lg">
          <Title order={4} mb="md">Líneas de revisión</Title>
          <ScrollArea>
            <Table style={{ minWidth: 300 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Línea</Table.Th>
                  <Table.Th>Capacidad/hora</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lineas.map(l => (
                  <Table.Tr key={l.id}>
                    <Table.Td>{l.nombre}</Table.Td>
                    <Table.Td>{l.capacidad} vehículos</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={l.activa ? 'teal' : 'gray'}>
                        {l.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        {/* ── USUARIOS ── */}
        <Tabs.Panel value="usuarios" pt="lg">
          <Title order={4} mb="md">Usuarios del sistema</Title>
          <ScrollArea>
            <Table striped highlightOnHover style={{ minWidth: 480 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Línea</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {usuariosIniciales.map(u => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.nombre}</Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{u.email}</Text></Table.Td>
                    <Table.Td>{u.rol}</Table.Td>
                    <Table.Td>{u.linea ?? '—'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={u.activo ? 'teal' : 'gray'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
