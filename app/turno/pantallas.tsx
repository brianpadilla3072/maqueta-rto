'use client'
// ── Componentes de pantalla reutilizables del Turnero ────────────
import React from 'react'
import { Box, Stack, Text, Button, Group, ThemeIcon, Title } from '@mantine/core'
import { IconAlertTriangle, IconArrowLeft, IconCircleCheck, IconX } from '@tabler/icons-react'

// ── Pantalla de pregunta SÍ / NO ─────────────────────────────────
export function PantallaYesNo({
  pregunta, subtext, onSi, onNo, onVolver,
}: {
  pregunta: string
  subtext?: string
  onSi: () => void
  onNo: () => void
  onVolver: () => void
}) {
  return (
    <Box style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack align="center" gap="xl" maw={600} w="100%" px="md">
        <Text style={{ fontSize: 28, lineHeight: 1.3, textAlign: 'center' }} fw={600}>
          {pregunta}
        </Text>
        {subtext && <Text size="md" c="dimmed" ta="center">{subtext}</Text>}
        <Group gap="lg" mt="lg" w="100%" justify="center">
          <Button size="xl" color="green"
            style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 24, borderRadius: 16 }}
            onClick={onSi}>SÍ</Button>
          <Button size="xl" color="red" variant="light"
            style={{ flex: 1, maxWidth: 220, height: 88, fontSize: 24, borderRadius: 16 }}
            onClick={onNo}>NO</Button>
        </Group>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={onVolver} size="sm">Volver</Button>
      </Box>
    </Box>
  )
}

// ── Pantalla de bloqueo / Hard Stop (rojo) ────────────────────────
export function PantallaBloqueo({
  titulo, mensaje, onReiniciar,
}: {
  titulo: string
  mensaje: string
  onReiniciar: () => void
}) {
  return (
    <Box bg="red.0" style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color="red"><IconX size={48} /></ThemeIcon>
        <Title order={2} c="red.8">{titulo}</Title>
        <Text size="lg" c="red.9">{mensaje}</Text>
        <Button size="lg" color="red" variant="light" leftSection={<IconArrowLeft size={18} />} onClick={onReiniciar}>
          Nueva búsqueda
        </Button>
      </Stack>
    </Box>
  )
}

// ── Pantalla de aviso informativo (naranja u azul) ────────────────
// Usada para: aviso_vigencia, polarizados_aviso, bandas_obs, rto_presentar, etc.
export function PantallaAviso({
  color = 'orange',
  titulo,
  mensaje,
  onContinuar,
  onVolver,
  labelContinuar = 'Entendido, continuar',
}: {
  color?: 'orange' | 'blue'
  titulo: string
  mensaje: React.ReactNode
  onContinuar: () => void
  onVolver: () => void
  labelContinuar?: string
}) {
  const Icono = color === 'blue' ? IconCircleCheck : IconAlertTriangle
  return (
    <Box bg={`${color}.0`} style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Stack align="center" gap="xl" maw={520} px="md" ta="center">
        <ThemeIcon size={80} radius="xl" color={color}><Icono size={48} /></ThemeIcon>
        <Title order={2} c={`${color}.8`}>{titulo}</Title>
        <Text size="lg" c={`${color}.9`}>{mensaje}</Text>
        <Button size="lg" color={color} onClick={onContinuar}>{labelContinuar}</Button>
      </Stack>
      <Box style={{ position: 'absolute', bottom: 32, left: 32 }}>
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={onVolver} size="sm">Volver</Button>
      </Box>
    </Box>
  )
}
