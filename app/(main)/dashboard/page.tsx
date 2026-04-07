'use client'
import { SimpleGrid, Card, Text, ThemeIcon, Stack, Group, Badge, RingProgress, Table, Box, ScrollArea } from '@mantine/core'
import {
  IconCar, IconClock, IconCircleCheck, IconAlertTriangle,
  IconCash, IconTool, IconSettings, IconCalendar,
  IconDeviceTablet, IconDeviceTv,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useAppColors } from '@/app/hooks/useAppColors'
import { colaInicial, cobrosIniciales, condicionalesVencidos, formatPesos } from '@/lib/mock'

// ── KPIs calculados desde el mock ──────────────────────────────────
function useDashboardData() {
  const enEspera    = colaInicial.filter(i => i.estado === 'EN_ESPERA').length
  const enRevision  = colaInicial.filter(i => i.estado === 'EN_REVISION').length
  const finalizados = colaInicial.filter(i => i.estado === 'FINALIZADO').length
  const totalCola   = colaInicial.length

  const cobrosPagados     = cobrosIniciales.filter(c => c.estado === 'PAGADO')
  const cobrosPendientes  = cobrosIniciales.filter(c => c.estado === 'PENDIENTE_VALIDACION')
  const totalCobrado      = cobrosPagados.reduce((acc, c) => acc + c.monto, 0)

  return { enEspera, enRevision, finalizados, totalCola, cobrosPagados, cobrosPendientes, totalCobrado }
}

// ── Acceso rápido ──────────────────────────────────────────────────
const ACCESOS = [
  { href: '/turno',   label: 'Turnero',  desc: 'Sacar turno',          icon: IconCalendar,     color: '#2563eb', bg: 'rgba(37,99,235,0.07)'   },
  { href: '/kiosk',   label: 'Kiosk',    desc: 'Consulta patente',      icon: IconDeviceTablet, color: '#0d9488', bg: 'rgba(13,148,136,0.07)'  },
  { href: '/display', label: 'Display',  desc: 'Pantalla de cola',      icon: IconDeviceTv,     color: '#7c3aed', bg: 'rgba(124,58,237,0.07)'  },
  { href: '/caja',    label: 'Caja',     desc: 'Cobros',                icon: IconCash,         color: '#059669', bg: 'rgba(5,150,105,0.07)'   },
  { href: '/tecnico', label: 'Técnico',  desc: 'Cola y revisiones',     icon: IconTool,         color: '#d97706', bg: 'rgba(217,119,6,0.07)'   },
  { href: '/config',  label: 'Config',   desc: 'Precios y horarios',    icon: IconSettings,     color: '#6b7280', bg: 'rgba(107,114,128,0.07)' },
]

export default function DashboardPage() {
  const C = useAppColors()
  const router = useRouter()
  const { enEspera, enRevision, finalizados, totalCola, cobrosPagados, cobrosPendientes, totalCobrado } = useDashboardData()

  const kpis = [
    {
      label: 'Vehículos en cola',
      value: String(totalCola),
      sub: `${enRevision} en revisión · ${enEspera} en espera`,
      icon: IconCar,
      ring: Math.round((enRevision / totalCola) * 100),
      ringColor: 'blue',
      color: C.info.color,
      bg: C.info.bg,
      border: C.info.border,
    },
    {
      label: 'Finalizados hoy',
      value: String(finalizados),
      sub: `de ${totalCola} turnos totales`,
      icon: IconCircleCheck,
      ring: Math.round((finalizados / totalCola) * 100),
      ringColor: 'teal',
      color: C.teal.color,
      bg: C.teal.bg,
      border: C.teal.border,
    },
    {
      label: 'Cobros del día',
      value: formatPesos(totalCobrado),
      sub: `${cobrosPagados.length} pagados · ${cobrosPendientes.length} pendientes`,
      icon: IconCash,
      ring: Math.round((cobrosPagados.length / cobrosIniciales.length) * 100),
      ringColor: 'green',
      color: C.success.color,
      bg: C.success.bg,
      border: C.success.border,
    },
    {
      label: 'Condicionales vencidos',
      value: String(condicionalesVencidos.length),
      sub: 'Requieren atención en caja',
      icon: IconAlertTriangle,
      ring: 100,
      ringColor: 'orange',
      color: C.danger.color,
      bg: C.danger.bg,
      border: C.danger.border,
    },
  ]

  return (
    <Stack gap="xl">

      {/* Encabezado */}
      <div>
        <Text style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Panel principal</Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Resumen operativo del día</Text>
      </div>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        {kpis.map((kpi) => (
          <Card key={kpi.label} withBorder radius="lg" p="lg"
            style={{ background: kpi.bg, borderColor: kpi.border }}>
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {kpi.label}
                </Text>
                <Text style={{ fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                  {kpi.value}
                </Text>
                <Text style={{ fontSize: 11.5, color: C.textMuted }}>{kpi.sub}</Text>
              </Stack>
              <RingProgress
                size={56} thickness={4} roundCaps
                sections={[{ value: kpi.ring, color: kpi.ringColor }]}
                label={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <ThemeIcon color={kpi.ringColor} variant="light" size={26} radius="xl">
                      <kpi.icon size={13} />
                    </ThemeIcon>
                  </div>
                }
              />
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* Acceso rápido + Cola actual */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">

        {/* Acceso rápido */}
        <Card withBorder radius="lg" p="lg" style={{ background: C.cardBg, borderColor: C.cardBorder }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 14 }}>
            Acceso rápido
          </Text>
          <SimpleGrid cols={3} spacing="sm">
            {ACCESOS.map(a => (
              <button
                key={a.href}
                onClick={() => router.push(a.href)}
                style={{
                  background: a.bg,
                  border: `1px solid ${a.color}22`,
                  borderRadius: 10,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.12s',
                }}
              >
                <a.icon size={20} color={a.color} />
                <span style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</span>
                <span style={{ fontSize: 10, color: C.textMuted, textAlign: 'center' }}>{a.desc}</span>
              </button>
            ))}
          </SimpleGrid>
        </Card>

        {/* Cola actual */}
        <Card withBorder radius="lg" p="lg" style={{ background: C.cardBg, borderColor: C.cardBorder }}>
          <Group justify="space-between" mb="md">
            <Text style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Cola actual</Text>
            <Badge color="blue" variant="light" size="sm">{totalCola} vehículos</Badge>
          </Group>
          <ScrollArea>
          <Table
            highlightOnHover
            style={{ minWidth: 380 }}
            styles={{
              th: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.textMuted },
              td: { borderColor: C.divider, fontSize: 13 },
            }}
          >
            <Table.Thead style={{ background: C.cardHeaderBg }}>
              <Table.Tr>
                <Table.Th>Patente</Table.Th>
                <Table.Th>Titular</Table.Th>
                <Table.Th>Línea</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {colaInicial.map(item => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                      {item.patente}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text style={{ fontSize: 12, color: C.textSecondary }}>{item.titular}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text style={{ fontSize: 12, color: C.textMuted }}>L{item.linea}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="xs"
                      radius="sm"
                      variant="light"
                      color={
                        item.estado === 'EN_REVISION' ? 'teal'
                        : item.estado === 'EN_ESPERA' ? 'blue'
                        : item.estado === 'INGRESO'   ? 'yellow'
                        : 'gray'
                      }
                    >
                      {item.estado.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          </ScrollArea>
        </Card>
      </SimpleGrid>

      {/* Condicionales vencidos */}
      {condicionalesVencidos.length > 0 && (
        <Card withBorder radius="lg" p="lg"
          style={{ background: C.danger.bg, borderColor: C.danger.border }}>
          <Group gap="sm" mb="md">
            <IconAlertTriangle size={16} color={C.danger.color} />
            <Text style={{ fontSize: 14, fontWeight: 600, color: C.danger.color }}>
              Condicionales vencidos — requieren atención
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {condicionalesVencidos.map(c => (
              <Box key={c.id} style={{
                background: C.cardBg,
                border: `1px solid ${C.danger.border}`,
                borderRadius: 8,
                padding: '10px 14px',
              }}>
                <Group justify="space-between">
                  <div>
                    <Text style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                      {c.patente}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.textMuted }}>{c.titular}</Text>
                  </div>
                  <Badge color="orange" variant="light" size="sm">{c.dias} días</Badge>
                </Group>
              </Box>
            ))}
          </SimpleGrid>
        </Card>
      )}

    </Stack>
  )
}
