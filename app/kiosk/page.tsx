'use client'
import { useState } from 'react'
import { Stack, Text, Button, Group, Box, Title } from '@mantine/core'
import { IconQrcode, IconArrowLeft, IconLetterCase, IconNumbers } from '@tabler/icons-react'
import { vehiculos } from '@/lib/mock'

type Resultado = null | 'ingrese' | 'caja_condicional' | 'caja_registro'
type Modo = 'letras' | 'numeros'

const LETRAS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

const NUMEROS = ['1','2','3','4','5','6','7','8','9','0']

const base = {
  fontFamily: 'monospace',
  borderRadius: 12,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation' as const,
  userSelect: 'none' as const,
}

export default function KioskPage() {
  const [patente, setPatente] = useState('')
  const [resultado, setResultado] = useState<Resultado>(null)
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState<typeof vehiculos[0] | null>(null)
  const [modo, setModo] = useState<Modo>('letras')

  const tecla = (t: string) => { if (patente.length < 8) setPatente(p => p + t) }
  const borrar = () => setPatente(p => p.slice(0, -1))

  const buscar = () => {
    const norm = (s: string) => s.replace(/\s/g, '').toUpperCase()
    const v = vehiculos.find(v => norm(v.patente) === norm(patente))
    if (!v) { setResultado('caja_registro'); setVehiculoEncontrado(null); return }
    if (v.condicional) { setResultado('caja_condicional'); setVehiculoEncontrado(v); return }
    setResultado('ingrese'); setVehiculoEncontrado(v)
  }

  const reset = () => { setPatente(''); setResultado(null); setVehiculoEncontrado(null) }

  if (resultado === 'ingrese') return (
    <Box h="100dvh" bg="green.8" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Stack align="center" gap="xl">
        <Text size="xl" c="white" fw={300} tt="uppercase" style={{ letterSpacing: 6 }}>Línea 1</Text>
        <Text style={{ fontSize: 80, fontFamily:'monospace', letterSpacing:12 }} c="white" fw={700}>{vehiculoEncontrado?.patente}</Text>
        <Text fz={32} c="white" fw={600}>Ingrese al predio</Text>
        <Text size="lg" c="green.2">{vehiculoEncontrado?.titular}</Text>
        <Button mt="xl" size="lg" variant="white" color="green" onClick={reset} leftSection={<IconArrowLeft />}>Nueva consulta</Button>
      </Stack>
    </Box>
  )

  if (resultado === 'caja_condicional') return (
    <Box h="100dvh" bg="orange.7" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Stack align="center" gap="xl">
        <Text style={{ fontSize: 80, fontFamily:'monospace', letterSpacing:12 }} c="white" fw={700}>{vehiculoEncontrado?.patente}</Text>
        <Text fz={32} c="white" fw={600}>Diríjase a caja</Text>
        <Text size="lg" c="orange.1">Tiene un condicional pendiente de {vehiculoEncontrado?.diasCondicional} días</Text>
        <Button mt="xl" size="lg" variant="white" color="orange" onClick={reset} leftSection={<IconArrowLeft />}>Nueva consulta</Button>
      </Stack>
    </Box>
  )

  if (resultado === 'caja_registro') return (
    <Box h="100dvh" bg="blue.8" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Stack align="center" gap="xl">
        <Text style={{ fontSize: 80, fontFamily:'monospace', letterSpacing:12 }} c="white" fw={700}>{patente}</Text>
        <Text fz={32} c="white" fw={600}>Diríjase a caja para registrarse</Text>
        <Text size="lg" c="blue.2">Sin historial previo en el sistema</Text>
        <Button mt="xl" size="lg" variant="white" color="blue" onClick={reset} leftSection={<IconArrowLeft />}>Nueva consulta</Button>
      </Stack>
    </Box>
  )

  return (
    <Box h="100dvh" bg="gray.9" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 20, gap: 16 }}>

      <Stack align="center" gap={2}>
        <Title order={1} c="white" style={{ letterSpacing: 2 }}>RTO Dynnamo</Title>
        <Text size="sm" c="dimmed">Ingresá la patente del vehículo</Text>
      </Stack>

      {/* Display */}
      <Box bg="gray.8" w="100%" maw={480} style={{ borderRadius: 16, padding: '18px 24px', textAlign: 'center', minHeight: 80, display:'flex', alignItems:'center', justifyContent:'center', userSelect:'none' }}>
        <Text style={{ fontSize: 46, fontFamily:'monospace', letterSpacing:10 }} c={patente ? 'white' : 'dimmed'}>
          {patente || 'ABC123'}
        </Text>
      </Box>

      {/* Teclado */}
      <Box w="100%" maw={480}>
        {modo === 'letras' ? (
          <Stack gap="xs">
            {LETRAS.map((fila, fi) => (
              <Group key={fi} gap="xs" justify="center" wrap="nowrap">
                {fila.map(t => (
                  <Button key={t} variant="filled" color="gray" onClick={() => tecla(t)}
                    style={{ ...base, height: 62, flex: 1, minWidth: 0, fontSize: 18 }}>
                    {t}
                  </Button>
                ))}
              </Group>
            ))}
            <Group gap="xs" wrap="nowrap">
              <Button variant="light" color="blue" onClick={() => setModo('numeros')}
                style={{ ...base, height: 62, flex: 2, fontSize: 16 }}
                leftSection={<IconNumbers size={18} />}>
                123
              </Button>
              <Button variant="light" color="red" onClick={borrar}
                style={{ ...base, height: 62, flex: 1, fontSize: 22 }}>
                ⌫
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="xs">
            {/* 3x3 */}
            {[[0,1,2],[3,4,5],[6,7,8]].map((fila, fi) => (
              <Group key={fi} gap="xs" wrap="nowrap">
                {fila.map(i => (
                  <Button key={NUMEROS[i]} variant="filled" color="gray" onClick={() => tecla(NUMEROS[i])}
                    style={{ ...base, height: 80, flex: 1, fontSize: 28 }}>
                    {NUMEROS[i]}
                  </Button>
                ))}
              </Group>
            ))}
            {/* Fila inferior: ABC | 0 | ⌫ */}
            <Group gap="xs" wrap="nowrap">
              <Button variant="light" color="blue" onClick={() => setModo('letras')}
                style={{ ...base, height: 80, flex: 1, fontSize: 15 }}
                leftSection={<IconLetterCase size={18} />}>
                ABC
              </Button>
              <Button variant="filled" color="gray" onClick={() => tecla('0')}
                style={{ ...base, height: 80, flex: 1, fontSize: 28 }}>
                0
              </Button>
              <Button variant="light" color="red" onClick={borrar}
                style={{ ...base, height: 80, flex: 1, fontSize: 22 }}>
                ⌫
              </Button>
            </Group>
          </Stack>
        )}
      </Box>

      {/* Acciones */}
      <Group w="100%" maw={480} gap="sm">
        <Button flex={1} size="lg" variant="light" color="gray" leftSection={<IconQrcode size={20} />} style={{ touchAction:'manipulation' }}>
          Escanear QR
        </Button>
        <Button flex={2} size="lg" color="green" onClick={buscar} disabled={patente.length < 6} style={{ touchAction:'manipulation' }}>
          Consultar
        </Button>
      </Group>

      <Text size="xs" c="dimmed">Probá: ABC123 · GHI789 · DEF456</Text>
    </Box>
  )
}
