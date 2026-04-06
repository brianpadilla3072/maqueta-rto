'use client'
import { useState, useEffect } from 'react'
import { Stack, Title, Card, Group, Text, Badge, Button, ThemeIcon, SimpleGrid, Alert } from '@mantine/core'
import { IconCar, IconCheck, IconX, IconAlertTriangle, IconPlayerPlay, IconClock } from '@tabler/icons-react'
import { colaInicial, type ColaItem, type EstadoCola } from '@/lib/mock'

const colorEstado: Record<EstadoCola, string> = {
  EN_ESPERA: 'blue',
  INGRESO: 'yellow',
  EN_REVISION: 'teal',
  FINALIZADO: 'gray',
}

const labelEstado: Record<EstadoCola, string> = {
  EN_ESPERA: 'En espera',
  INGRESO: 'Ingresó a línea',
  EN_REVISION: 'En revisión',
  FINALIZADO: 'Finalizado',
}

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

export default function TecnicoPage() {
  const [cola, setCola] = useState<ColaItem[]>(colaInicial.filter(i => i.linea === 1))
  const [linea] = useState(1)
  const tecnico = 'Carlos García'

  const avanzar = (id: string, nuevoEstado: EstadoCola) =>
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: nuevoEstado } : i))

  const ahora = new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })

  return (
    <Stack maw={700} mx="auto">
      <Group justify="space-between" align="center">
        <Title order={2}>Técnico — Línea {linea}</Title>
        <Text size="sm" c="dimmed">{tecnico} · {ahora}</Text>
      </Group>

      <SimpleGrid cols={3}>
        {(['EN_ESPERA','EN_REVISION','FINALIZADO'] as EstadoCola[]).map(e => {
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
        {cola.filter(i => i.estado !== 'FINALIZADO').map(item => (
          <Card key={item.id} withBorder shadow="sm">
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
                  <Button
                    size="xs"
                    color="yellow"
                    variant="light"
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={() => avanzar(item.id, 'INGRESO')}
                  >
                    Ingresó a línea
                  </Button>
                )}
                {item.estado === 'INGRESO' && (
                  <Button
                    size="xs"
                    color="teal"
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={() => avanzar(item.id, 'EN_REVISION')}
                  >
                    Iniciar revisión
                  </Button>
                )}
                {item.estado === 'EN_REVISION' && (
                  <Group gap="xs">
                    <Button size="xs" color="green" leftSection={<IconCheck size={14} />}
                      onClick={() => avanzar(item.id, 'FINALIZADO')}>
                      Aprobado
                    </Button>
                    <Button size="xs" color="orange" variant="light" leftSection={<IconAlertTriangle size={14} />}
                      onClick={() => avanzar(item.id, 'FINALIZADO')}>
                      Condicional
                    </Button>
                    <Button size="xs" color="red" variant="light" leftSection={<IconX size={14} />}
                      onClick={() => avanzar(item.id, 'FINALIZADO')}>
                      Rechazado
                    </Button>
                  </Group>
                )}
              </Stack>
            </Group>
          </Card>
        ))}

        {cola.filter(i => i.estado === 'FINALIZADO').length > 0 && (
          <Stack gap="xs">
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">Finalizados</Text>
            {cola.filter(i => i.estado === 'FINALIZADO').map(item => (
              <Card key={item.id} withBorder opacity={0.6}>
                <Group justify="space-between">
                  <Text ff="monospace" size="sm" c="dimmed" style={{ letterSpacing: 2 }}>{item.patente}</Text>
                  <Badge size="sm" color="gray" variant="light">Finalizado</Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {cola.filter(i => i.estado !== 'FINALIZADO').length === 0 && (
          <Alert icon={<IconCheck size={16} />} color="green" title="Cola vacía">
            No hay vehículos en cola por el momento.
          </Alert>
        )}
      </Stack>
    </Stack>
  )
}
