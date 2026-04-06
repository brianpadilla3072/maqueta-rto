'use client'
import { useState } from 'react'
import {
  Stack, Title, Tabs, Table, NumberInput, Button, Group, Text,
  Checkbox, Switch, Modal, TextInput, Select, Card, SimpleGrid,
} from '@mantine/core'
import {
  IconCurrencyDollar, IconClock, IconTruck, IconUsers, IconPlus,
} from '@tabler/icons-react'
import { preciosIniciales, usuariosIniciales, type Usuario } from '@/lib/mock'

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function ConfigPage() {
  const [precios, setPrecios] = useState(preciosIniciales)
  const [diasHabiles, setDiasHabiles] = useState(['Lunes','Martes','Miércoles','Jueves','Viernes'])
  const [apertura, setApertura] = useState('08:00')
  const [cierre, setCierre] = useState('17:00')
  const [lineas, setLineas] = useState([
    { id: 1, nombre: 'Línea 1', capacidad: 8, activa: true },
    { id: 2, nombre: 'Línea 2', capacidad: 6, activa: true },
  ])
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales)
  const [modalUsuario, setModalUsuario] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', rol: 'TECNICO' as Usuario['rol'] })

  const agregarUsuario = () => {
    setUsuarios(prev => [...prev, {
      id: String(Date.now()),
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      activo: true,
    }])
    setNuevoUsuario({ nombre: '', email: '', rol: 'TECNICO' })
    setModalUsuario(false)
  }

  const toggleUsuario = (id: string) =>
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))

  return (
    <Stack maw={860} mx="auto">
      <Title order={2}>Configuración</Title>

      <Tabs defaultValue="precios">
        <Tabs.List>
          <Tabs.Tab value="precios" leftSection={<IconCurrencyDollar size={16} />}>Precios</Tabs.Tab>
          <Tabs.Tab value="horarios" leftSection={<IconClock size={16} />}>Horarios</Tabs.Tab>
          <Tabs.Tab value="lineas" leftSection={<IconTruck size={16} />}>Líneas</Tabs.Tab>
          <Tabs.Tab value="usuarios" leftSection={<IconUsers size={16} />}>Usuarios</Tabs.Tab>
        </Tabs.List>

        {/* ── PRECIOS ── */}
        <Tabs.Panel value="precios" pt="lg">
          <Title order={4} mb="md">Precios por tipo de vehículo</Title>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Precio actual</Table.Th>
                <Table.Th>Editar</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Object.entries(precios).map(([tipo, valor]) => (
                <Table.Tr key={tipo}>
                  <Table.Td>{tipo}</Table.Td>
                  <Table.Td>
                    <Text fw={500}>{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(valor)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={valor}
                      onChange={(v) => setPrecios(p => ({ ...p, [tipo]: Number(v) }))}
                      prefix="$ "
                      thousandSeparator="."
                      decimalSeparator=","
                      size="xs"
                      style={{ width: 150 }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Button mt="md" color="green">Guardar precios</Button>
        </Tabs.Panel>

        {/* ── HORARIOS ── */}
        <Tabs.Panel value="horarios" pt="lg">
          <Title order={4} mb="md">Días y horarios de atención</Title>
          <Stack gap="lg">
            <div>
              <Text fw={500} mb="sm">Días hábiles</Text>
              <Checkbox.Group value={diasHabiles} onChange={setDiasHabiles}>
                <Group gap="md">
                  {diasSemana.map(d => (
                    <Checkbox key={d} value={d} label={d} />
                  ))}
                </Group>
              </Checkbox.Group>
            </div>
            <SimpleGrid cols={2}>
              <div>
                <Text fw={500} mb="xs">Apertura</Text>
                <TextInput
                  type="time"
                  value={apertura}
                  onChange={e => setApertura(e.target.value)}
                  style={{ width: 140 }}
                />
              </div>
              <div>
                <Text fw={500} mb="xs">Cierre</Text>
                <TextInput
                  type="time"
                  value={cierre}
                  onChange={e => setCierre(e.target.value)}
                  style={{ width: 140 }}
                />
              </div>
            </SimpleGrid>
            <Button color="green" style={{ width: 'fit-content' }}>Guardar horarios</Button>
          </Stack>
        </Tabs.Panel>

        {/* ── LÍNEAS ── */}
        <Tabs.Panel value="lineas" pt="lg">
          <Title order={4} mb="md">Gestión de líneas</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Línea</Table.Th>
                <Table.Th>Capacidad/hora</Table.Th>
                <Table.Th>Activa</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lineas.map(l => (
                <Table.Tr key={l.id}>
                  <Table.Td>{l.nombre}</Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={l.capacidad}
                      onChange={v => setLineas(prev => prev.map(x => x.id === l.id ? { ...x, capacidad: Number(v) } : x))}
                      min={1} max={20}
                      size="xs"
                      style={{ width: 100 }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      checked={l.activa}
                      onChange={() => setLineas(prev => prev.map(x => x.id === l.id ? { ...x, activa: !x.activa } : x))}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Button mt="md" color="green">Guardar líneas</Button>
        </Tabs.Panel>

        {/* ── USUARIOS ── */}
        <Tabs.Panel value="usuarios" pt="lg">
          <Group justify="space-between" align="center" mb="md">
            <Title order={4}>Usuarios del sistema</Title>
            <Button size="sm" leftSection={<IconPlus size={16} />} onClick={() => setModalUsuario(true)}>
              Agregar usuario
            </Button>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Línea</Table.Th>
                <Table.Th>Activo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {usuarios.map(u => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.nombre}</Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.email}</Text></Table.Td>
                  <Table.Td>{u.rol}</Table.Td>
                  <Table.Td>{u.linea ?? '—'}</Table.Td>
                  <Table.Td>
                    <Switch checked={u.activo} onChange={() => toggleUsuario(u.id)} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      {/* Modal nuevo usuario */}
      <Modal opened={modalUsuario} onClose={() => setModalUsuario(false)} title="Agregar usuario" centered>
        <Stack>
          <TextInput
            label="Nombre completo"
            value={nuevoUsuario.nombre}
            onChange={e => setNuevoUsuario(p => ({ ...p, nombre: e.target.value }))}
          />
          <TextInput
            label="Email"
            type="email"
            value={nuevoUsuario.email}
            onChange={e => setNuevoUsuario(p => ({ ...p, email: e.target.value }))}
          />
          <Select
            label="Rol"
            value={nuevoUsuario.rol}
            onChange={v => setNuevoUsuario(p => ({ ...p, rol: v as Usuario['rol'] }))}
            data={[
              { value: 'TECNICO', label: 'Técnico' },
              { value: 'CAJERA', label: 'Cajera' },
              { value: 'DIRECTOR', label: 'Director' },
            ]}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalUsuario(false)}>Cancelar</Button>
            <Button
              color="green"
              onClick={agregarUsuario}
              disabled={!nuevoUsuario.nombre || !nuevoUsuario.email}
            >
              Agregar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
