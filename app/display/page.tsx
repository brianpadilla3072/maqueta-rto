'use client'
import { useState, useEffect } from 'react'
import { Box, Grid, Stack, Text, Badge, Divider, Group } from '@mantine/core'
import { useInterval } from '@mantine/hooks'
import { colaInicial, type ColaItem, type EstadoCola } from '@/lib/mock'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const colorEstado: Record<EstadoCola, string> = {
  EN_ESPERA: 'blue',
  INGRESO: 'yellow',
  EN_REVISION: 'green',
  FINALIZADO: 'gray',
}

const labelEstado: Record<EstadoCola, string> = {
  EN_ESPERA: 'ESPERA',
  INGRESO: 'INGRESO',
  EN_REVISION: 'EN REVISIÓN',
  FINALIZADO: 'FINALIZADO',
}

export default function DisplayPage() {
  const [cola, setCola] = useState<ColaItem[]>(colaInicial)
  const [ahora, setAhora] = useState(dayjs())

  // Reloj en tiempo real
  useInterval(() => setAhora(dayjs()), 1000)

  // Simulación: cada 12s avanza un estado en algún ítem
  useInterval(() => {
    setCola(prev => {
      const siguiente = [...prev]
      const idx = siguiente.findIndex(i => i.estado === 'EN_ESPERA')
      if (idx !== -1) {
        siguiente[idx] = { ...siguiente[idx], estado: 'INGRESO' }
      } else {
        const rev = siguiente.findIndex(i => i.estado === 'INGRESO')
        if (rev !== -1) siguiente[rev] = { ...siguiente[rev], estado: 'EN_REVISION' }
      }
      return siguiente
    })
  }, 12000)

  const linea1 = cola.filter(i => i.linea === 1)
  const linea2 = cola.filter(i => i.linea === 2)

  const Linea = ({ num, items }: { num: number; items: ColaItem[] }) => {
    const activo = items.some(i => i.estado === 'EN_REVISION')
    return (
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="center">
          <Text fz={28} fw={700} c="white" style={{ letterSpacing: 2 }}>
            LÍNEA {num}
          </Text>
          <Badge size="xl" color={activo ? 'green' : 'gray'} variant="filled" style={{ fontSize: 14 }}>
            {activo ? 'ACTIVA' : 'SIN ACTIVIDAD'}
          </Badge>
        </Group>
        <Divider color="gray.7" />
        <Stack gap="sm">
          {items.map((item) => (
            <Box
              key={item.id}
              bg={item.estado === 'EN_REVISION' ? 'green.9' : 'gray.8'}
              p="md"
              style={{ borderRadius: 12, borderLeft: `6px solid var(--mantine-color-${colorEstado[item.estado]}-6)` }}
            >
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Text
                    style={{ fontFamily: 'monospace', fontSize: 32, letterSpacing: 6 }}
                    c="white"
                    fw={700}
                  >
                    {item.patente}
                  </Text>
                  <Text size="sm" c="gray.4">{item.titular} · {item.tipo}</Text>
                </Stack>
                <Badge size="lg" color={colorEstado[item.estado]} variant="filled">
                  {labelEstado[item.estado]}
                </Badge>
              </Group>
            </Box>
          ))}
          {items.length === 0 && (
            <Text c="gray.6" size="lg" ta="center" mt="xl">Sin vehículos en cola</Text>
          )}
        </Stack>
      </Stack>
    )
  }

  return (
    <Box h="100dvh" bg="gray.9" p="xl" style={{ display:'flex', flexDirection:'column', gap: 24 }}>
      {/* Header */}
      <Group justify="space-between" align="center">
        <Text fz={20} fw={700} c="white" style={{ letterSpacing: 4, textTransform:'uppercase' }}>
          RTO Dynnamo
        </Text>
        <Text
          style={{ fontFamily:'monospace', fontSize: 28, letterSpacing: 4 }}
          c="green.4"
          fw={600}
        >
          {ahora.format('HH:mm:ss')}
        </Text>
        <Text size="sm" c="gray.5" tt="capitalize">
          {ahora.format('dddd DD/MM/YYYY')}
        </Text>
      </Group>

      <Divider color="gray.7" />

      {/* Columnas */}
      <Grid flex={1} gutter="xl">
        <Grid.Col span={6}>
          <Linea num={1} items={linea1} />
        </Grid.Col>
        <Grid.Col span={6}>
          <Linea num={2} items={linea2} />
        </Grid.Col>
      </Grid>

      {/* Footer */}
      <Text size="xs" c="gray.6" ta="center">
        Actualización automática cada 12 segundos
      </Text>
    </Box>
  )
}
