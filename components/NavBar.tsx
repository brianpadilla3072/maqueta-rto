'use client'
import { Stack, SegmentedControl, NavLink, Text, Divider, Badge } from '@mantine/core'
import {
  IconCalendar, IconDeviceTablet, IconDeviceTv,
  IconCash, IconTool, IconLayoutDashboard, IconSettings,
} from '@tabler/icons-react'
import { usePathname, useRouter } from 'next/navigation'
import { useRol, type Rol } from '@/contexts/RoleContext'

const items = [
  { href: '/dashboard', label: 'Inicio',   icon: IconLayoutDashboard,  roles: ['Público', 'Técnico', 'Cajera', 'Director'] },
  { href: '/turno',     label: 'Turnero',  icon: IconCalendar,         roles: ['Público', 'Técnico', 'Cajera', 'Director'] },
  { href: '/kiosk',     label: 'Kiosk',    icon: IconDeviceTablet,     roles: ['Público', 'Técnico', 'Cajera', 'Director'] },
  { href: '/display',   label: 'Display',  icon: IconDeviceTv,         roles: ['Público', 'Técnico', 'Cajera', 'Director'] },
  { href: '/caja',      label: 'Caja',     icon: IconCash,             roles: ['Cajera', 'Director'] },
  { href: '/tecnico',   label: 'Técnico',  icon: IconTool,             roles: ['Técnico', 'Director'] },
  { href: '/admin',     label: 'Admin',    icon: IconLayoutDashboard,  roles: ['Cajera', 'Director'] },
  { href: '/config',    label: 'Config',   icon: IconSettings,         roles: ['Director'] },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { rol, setRol } = useRol()

  return (
    <Stack h="100%" p="sm" gap="xs">
      <Text fw={700} size="sm" c="dimmed" tt="uppercase" mb={4}>RTO Dynnamo</Text>

      <Text size="xs" c="dimmed" mb={2}>Rol de demo</Text>
      <SegmentedControl
        size="xs"
        value={rol}
        onChange={(v) => setRol(v as Rol)}
        data={['Público', 'Cajera', 'Técnico', 'Director']}
        fullWidth
        mb="xs"
      />

      <Divider />

      <Stack gap={2} mt="xs">
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          const roleMatch = item.roles.includes(rol)
          return (
            <NavLink
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={16} />}
              active={active}
              onClick={() => router.push(item.href)}
              opacity={roleMatch ? 1 : 0.35}
              rightSection={
                roleMatch && !['Público'].includes(item.roles[0]) ? null :
                !roleMatch ? <Badge size="xs" color="gray" variant="light">otro rol</Badge> : null
              }
            />
          )
        })}
      </Stack>
    </Stack>
  )
}
