'use client'
import { useState } from 'react'
import { Tooltip, ActionIcon, Avatar, Text, Drawer, Burger, Menu } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconChevronLeft, IconChevronRight, IconMoon, IconSun,
  IconCash, IconTool, IconLayoutDashboard, IconSettings,
  IconShieldHalf, IconLogout, IconUser, IconChevronDown,
} from '@tabler/icons-react'
import { usePathname, useRouter } from 'next/navigation'
import { useRol } from '@/contexts/RoleContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAppColors } from '@/app/hooks/useAppColors'
import type { ReactNode } from 'react'

// ── Nav items ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio',   icon: IconLayoutDashboard, roles: ['Público', 'Técnico', 'Cajera', 'Director'] },
  { href: '/caja',      label: 'Caja',     icon: IconCash,            roles: ['Cajera', 'Director'] },
  { href: '/tecnico',   label: 'Técnico',  icon: IconTool,            roles: ['Técnico', 'Director'] },
  { href: '/config',    label: 'Administración',   icon: IconSettings,        roles: ['Director'] },
]

// ── SidebarNavItem ─────────────────────────────────────────────────
function SidebarNavItem({
  icon: Icon, label, active, dimmed, onClick, collapsed,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  dimmed: boolean
  onClick: () => void
  collapsed: boolean
}) {
  const C = useAppColors()
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '9px 0' : '9px 10px',
        borderRadius: 8,
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active ? C.info.bg : 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderLeft: active ? `2.5px solid ${C.info.color}` : '2.5px solid transparent',
        marginBottom: 2,
        transition: 'background 0.12s, border-color 0.12s',
        opacity: dimmed ? 0.38 : 1,
      }}
    >
      <Icon size={16} color={active ? C.info.color : C.textMuted} style={{ flexShrink: 0 }} />
      {!collapsed && (
        <span style={{
          fontSize: 13.5,
          fontWeight: active ? 600 : 400,
          color: active ? C.info.color : C.textSecondary,
          flex: 1,
          textAlign: 'left',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
    </button>
  )
}

// ── NavContent — compartido entre desktop sidebar y mobile drawer ──
function NavContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate: () => void
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const C = useAppColors()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const pathname = usePathname()
  const router = useRouter()
  const { rol } = useRol()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const navigate = (href: string) => {
    router.push(href)
    onNavigate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 14px 16px' : '20px 18px 16px',
        borderBottom: `1px solid ${C.sidebarBorder}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            background: 'rgba(37,99,235,0.08)',
            border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: 9, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconShieldHalf size={18} color="#3b82f6" />
          </div>
          {!collapsed && (
            <div>
              <p style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                RTO Dynnamo
              </p>
              <p style={{ color: C.textMuted, fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
                Sistema
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Label sección */}
      {!collapsed && (
        <p style={{ padding: '8px 16px 2px', color: C.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          Navegación
        </p>
      )}

      {/* Nav items */}
      <div style={{ padding: '6px 10px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const allowed = item.roles.includes(rol)
          return (
            <Tooltip key={item.href} label={item.label} position="right" withArrow disabled={!collapsed}>
              <div>
                <SidebarNavItem
                  icon={item.icon}
                  label={item.label}
                  active={active}
                  dimmed={!allowed}
                  onClick={() => navigate(item.href)}
                  collapsed={collapsed}
                />
              </div>
            </Tooltip>
          )
        })}
      </div>

      {/* Footer usuario */}
      <div style={{ borderTop: `1px solid ${C.sidebarBorder}`, padding: '12px 10px' }}>
        {!collapsed ? (
          <Menu shadow="md" width={200} opened={menuAbierto} onChange={setMenuAbierto}>
              <Menu.Target>
                <button style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}>
                  <Avatar color="blue" radius="xl" size="sm">
                    {(user?.label ?? rol)[0].toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600, margin: 0 }}>{user?.label ?? rol}</p>
                    <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>{user?.username}</p>
                  </div>
                  <IconChevronDown
                    size={14}
                    color={C.textMuted}
                    style={{ transition: 'transform 0.2s', transform: menuAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item icon={<IconUser size={14} />} disabled>
                  Perfil
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  icon={isDark ? <IconSun size={14} color="#fbbf24" /> : <IconMoon size={14} color="#64748b" />}
                  onClick={toggleColorScheme}
                >
                  {isDark ? 'Modo claro' : 'Modo oscuro'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  icon={<IconLogout size={14} color="#ef4444" />}
                  color="red"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
        ) : (
          <Menu shadow="md" width={200} opened={menuAbierto} onChange={setMenuAbierto}>
            <Menu.Target>
              <Tooltip label={user?.label ?? rol} position="right" withArrow>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar color="blue" radius="xl" size="sm" style={{ cursor: 'pointer' }}>
                    {(user?.label ?? rol)[0].toUpperCase()}
                  </Avatar>
                  <IconChevronDown
                    size={10}
                    color={C.textMuted}
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      transition: 'transform 0.2s',
                      transform: menuAbierto ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </div>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconUser size={14} />} disabled>
                Perfil
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                icon={isDark ? <IconSun size={14} color="#fbbf24" /> : <IconMoon size={14} color="#64748b" />}
                onClick={toggleColorScheme}
              >
                {isDark ? 'Modo claro' : 'Modo oscuro'}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                icon={<IconLogout size={14} color="#ef4444" />}
                color="red"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </div>
    </div>
  )
}

// ── AppFrame ───────────────────────────────────────────────────────
export default function AppFrame({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed]       = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const C = useAppColors()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const sidebarW = collapsed ? 64 : 240

  // ── MOBILE ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <Drawer
          opened={drawerAbierto}
          onClose={() => setDrawerAbierto(false)}
          position="left"
          size={260}
          padding={0}
          withCloseButton={false}
          styles={{
            body: { padding: 0, height: '100%' },
            content: { background: C.sidebarBg },
          }}
        >
          <NavContent collapsed={false} onNavigate={() => setDrawerAbierto(false)} />
        </Drawer>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: C.mainBg }}>

          {/* Top bar */}
          <div style={{
            height: 56,
            background: C.headerBg,
            borderBottom: `1px solid ${C.headerBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0,
          }}>
            <Burger
              opened={drawerAbierto}
              onClick={() => setDrawerAbierto(v => !v)}
              size="sm"
              color={C.textSecondary}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.15)',
                borderRadius: 7, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconShieldHalf size={14} color="#3b82f6" />
              </div>
              <Text fw={700} size="sm" style={{ color: C.textPrimary }}>RTO Dynnamo</Text>
            </div>

            <ActionIcon variant="subtle" color="gray" onClick={toggleColorScheme}>
              {isDark ? <IconSun size={16} color="#fbbf24" /> : <IconMoon size={16} color="#64748b" />}
            </ActionIcon>
          </div>

          {/* Contenido */}
          <main style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {children}
          </main>
        </div>
      </>
    )
  }

  // ── DESKTOP ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100dvh', background: C.mainBg, overflow: 'hidden' }}>

      <aside style={{
        width: sidebarW,
        flexShrink: 0,
        background: C.sidebarBg,
        borderRight: `1px solid ${C.sidebarBorder}`,
        transition: 'width 220ms cubic-bezier(.4,0,.2,1)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Botón de colapso */}
        <Tooltip label={collapsed ? 'Expandir' : 'Colapsar'} position="right" withArrow>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{
              position: 'absolute',
              top: 18,
              right: -14,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: C.cardBg,
              border: `1.5px solid ${C.sidebarBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.10)',
              zIndex: 20,
            }}
          >
            {collapsed
              ? <IconChevronRight size={14} color={C.textMuted} />
              : <IconChevronLeft size={14} color={C.textMuted} />
            }
          </button>
        </Tooltip>

        <NavContent collapsed={collapsed} onNavigate={() => {}} />
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: C.mainBg, padding: 24 }}>
        {children}
      </main>
    </div>
  )
}
