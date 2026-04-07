'use client'
import { useState } from 'react'
import { Stack, Text, Button, Group, Box, Title, TextInput } from '@mantine/core'
import { IconQrcode, IconArrowLeft } from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'
import { vehiculos } from '@/lib/mock'

const DISPLAY_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/display`
  : 'http://localhost:3001/display'

type Resultado = null | 'ingrese' | 'caja_condicional' | 'caja_registro'

export default function KioskPage() {
  const [patente, setPatente] = useState('')
  const [resultado, setResultado] = useState<Resultado>(null)
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState<typeof vehiculos[0] | null>(null)

  const buscar = () => {
    const norm = (s: string) => s.replace(/\s/g, '').toUpperCase()
    const v = vehiculos.find(v => norm(v.patente) === norm(patente))
    if (!v) { setResultado('caja_registro'); setVehiculoEncontrado(null); return }
    if (v.condicional) { setResultado('caja_condicional'); setVehiculoEncontrado(v); return }
    setResultado('ingrese'); setVehiculoEncontrado(v)
  }

  const reset = () => { setPatente(''); setResultado(null); setVehiculoEncontrado(null) }

  if (resultado === 'ingrese') return (
    <Box h="100dvh" bg="green.8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl">
        <Text style={{ fontSize: 80, fontFamily: 'monospace', letterSpacing: 12 }} c="white" fw={700}>
          {vehiculoEncontrado?.patente}
        </Text>
        <Text fz={32} c="white" fw={600}>Aguardá a ser llamado</Text>
        <Text size="lg" c="green.2">{vehiculoEncontrado?.titular}</Text>

        {/* QR hacia la pantalla del display */}
        <Stack align="center" gap="xs" mt="md">
          <Box style={{ background: 'white', padding: 16, borderRadius: 16 }}>
            <QRCodeSVG value={DISPLAY_URL} size={160} />
          </Box>
          <Text size="xs" c="green.2" ff="monospace">{DISPLAY_URL}</Text>
          <Text size="xs" c="green.3">Seguí el turno en la pantalla de cola</Text>
        </Stack>

        <Button mt="sm" size="lg" variant="white" color="green" onClick={reset} leftSection={<IconArrowLeft />}>
          Nueva consulta
        </Button>
      </Stack>
    </Box>
  )

  if (resultado === 'caja_condicional') return (
    <Box h="100dvh" bg="orange.7" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl">
        <Text style={{ fontSize: 80, fontFamily: 'monospace', letterSpacing: 12 }} c="white" fw={700}>{vehiculoEncontrado?.patente}</Text>
        <Text fz={32} c="white" fw={600}>Diríjase a caja</Text>
        <Text size="lg" c="orange.1">Tiene un condicional pendiente de {vehiculoEncontrado?.diasCondicional} días</Text>
        <Button mt="xl" size="lg" variant="white" color="orange" onClick={reset} leftSection={<IconArrowLeft />}>Nueva consulta</Button>
      </Stack>
    </Box>
  )

  if (resultado === 'caja_registro') return (
    <Box h="100dvh" bg="blue.8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl">
        <Text style={{ fontSize: 80, fontFamily: 'monospace', letterSpacing: 12 }} c="white" fw={700}>{patente}</Text>
        <Text fz={32} c="white" fw={600}>Diríjase a caja para registrarse</Text>
        <Text size="lg" c="blue.2">Sin historial previo en el sistema</Text>
        <Button mt="xl" size="lg" variant="white" color="blue" onClick={reset} leftSection={<IconArrowLeft />}>Nueva consulta</Button>
      </Stack>
    </Box>
  )

  return (
    <Box
      h="100dvh"
      bg="gray.9"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 24 }}
    >
      <Stack align="center" gap={4}>
        <Title order={1} c="white" style={{ letterSpacing: 2 }}>RTO Dynnamo</Title>
        <Text size="sm" c="dimmed">Ingresá la patente del vehículo</Text>
      </Stack>

      <Box w="100%" maw={480}>
        <TextInput
          autoFocus
          size="xl"
          placeholder="ABC 123"
          value={patente}
          onChange={e => setPatente(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter' && patente.length >= 6) buscar() }}
          styles={{
            input: {
              fontFamily: 'monospace',
              letterSpacing: 8,
              fontSize: 32,
              textAlign: 'center',
              height: 80,
            },
          }}
        />
      </Box>

      <Group w="100%" maw={480} gap="sm">
        <Button flex={1} size="lg" variant="light" color="gray" leftSection={<IconQrcode size={20} />} style={{ touchAction: 'manipulation' }}>
          Escanear QR
        </Button>
        <Button flex={2} size="lg" color="green" onClick={buscar} disabled={patente.length < 6} style={{ touchAction: 'manipulation' }}>
          Consultar
        </Button>
      </Group>

      <Text size="xs" c="dimmed">Probá: ABC123 · GHI789 · DEF456</Text>
    </Box>
  )
}
