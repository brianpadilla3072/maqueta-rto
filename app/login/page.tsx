'use client'
import { useState } from 'react'
import {
  Box, Stack, Text, TextInput, PasswordInput, Button, Group,
  Divider, UnstyledButton, ActionIcon,
} from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconShieldHalf, IconUser, IconLock, IconArrowRight, IconMoon, IconSun,
  IconCalendar, IconCash, IconCar,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useAuth, type AuthUser } from '@/contexts/AuthContext'
import { useAppColors } from '@/app/hooks/useAppColors'
import type { Rol } from '@/contexts/RoleContext'

// ── Usuarios hardcodeados ──────────────────────────────────────────
const USERS: (AuthUser & { password: string })[] = [
  { username: 'cajero',   password: '1234', rol: 'Cajera',   label: 'Cajero/a' },
  { username: 'tecnico',  password: '1234', rol: 'Técnico',  label: 'Técnico'  },
  { username: 'director', password: '1234', rol: 'Director', label: 'Director' },
]

const FEATURES = [
  { icon: IconCalendar, title: 'Gestión de turnos',      desc: 'Cola de revisión en tiempo real' },
  { icon: IconCash,     title: 'Control de cobros',      desc: 'Pagos, transferencias y posnet' },
  { icon: IconCar,      title: 'Revisión técnica',       desc: 'Flujo completo por tipo de vehículo' },
]

export default function LoginPage() {
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const C = useAppColors()
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = () => {
    const user = USERS.find(u => u.username === username && u.password === password)
    if (!user) {
      notifications.show({
        title: 'Acceso denegado',
        message: 'Usuario o contraseña incorrectos.',
        color: 'orange',
      })
      return
    }
    setLoading(true)
    setTimeout(() => {
      login({ username: user.username, label: user.label, rol: user.rol })
      setLoading(false)
      router.replace('/dashboard')
    }, 800)
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', background: C.mainBg, position: 'relative' }}>

      {/* Toggle dark mode */}
      <ActionIcon
        variant="subtle" color="gray" size="lg"
        onClick={toggleColorScheme}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: C.cardBg, border: `1px solid ${C.border}`,
          zIndex: 10,
        }}
      >
        {isDark ? <IconSun size={17} color="#fbbf24" /> : <IconMoon size={17} color="#64748b" />}
      </ActionIcon>

      {/* ── Panel izquierdo — branding ── */}
      <Box
        visibleFrom="md"
        style={{
          width: '42%',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(59,130,246,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(59,130,246,0.03)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60, position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 12, width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconShieldHalf size={22} color="#60a5fa" />
          </div>
          <div>
            <p style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, lineHeight: 1, margin: 0 }}>RTO Dynnamo</p>
            <p style={{ color: '#475569', fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase', margin: 0 }}>Sistema de gestión</p>
          </div>
        </div>

        {/* Titular */}
        <p style={{ color: '#f8fafc', fontSize: 30, fontWeight: 700, lineHeight: 1.2, marginBottom: 12 }}>
          Revisión técnica obligatoria
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.65, marginBottom: 48 }}>
          Plataforma integral para la gestión de turnos, cobros y revisiones vehiculares.
        </p>

        {/* Features */}
        <Stack gap={24}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.12)',
                borderRadius: 10, width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>
                <f.icon size={17} color="#60a5fa" />
              </div>
              <div>
                <p style={{ color: '#f1f5f9', fontSize: 13.5, fontWeight: 600, marginBottom: 3, marginTop: 0 }}>{f.title}</p>
                <p style={{ color: '#64748b', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </Stack>

        {/* Footer */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }} />
          <p style={{ color: '#334155', fontSize: 11.5, margin: 0 }}>© 2026 RTO Dynnamo — Maqueta</p>
        </div>
      </Box>

      {/* ── Panel derecho — formulario ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: C.mainBg,
      }}>
        <Box style={{ width: '100%', maxWidth: 420 }}>

          <Text style={{ color: C.textPrimary, fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Iniciar sesión
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 32 }}>
            Ingresá tus credenciales para acceder al sistema
          </Text>

          <Stack gap="md">
            <TextInput
              label="Usuario"
              placeholder="nombre.usuario"
              size="md"
              value={username}
              onChange={e => setUsername(e.target.value)}
              leftSection={<IconUser size={15} color={C.textSubtle} />}
              styles={{
                label: { color: C.textLabel, fontSize: 13, fontWeight: 500, marginBottom: 5 },
                input: { background: C.inputBg, borderColor: C.inputBorder, color: C.inputColor },
              }}
            />
            <PasswordInput
              label="Contraseña"
              placeholder="••••••••"
              size="md"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              leftSection={<IconLock size={15} color={C.textSubtle} />}
              styles={{
                label: { color: C.textLabel, fontSize: 13, fontWeight: 500, marginBottom: 5 },
                input: { background: C.inputBg, borderColor: C.inputBorder, color: C.inputColor },
              }}
            />
          </Stack>

          <Button
            fullWidth size="md" mt="xl"
            loading={loading}
            onClick={handleLogin}
            rightSection={!loading && <IconArrowRight size={16} />}
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              fontWeight: 600, fontSize: 14, height: 46,
            }}
          >
            Acceder al sistema
          </Button>

          <Divider
            my="xl"
            label={<Text size="xs" c="dimmed">Acceso de demostración</Text>}
            labelPosition="center"
          />

          <Stack gap={8}>
            {USERS.map(u => (
              <UnstyledButton
                key={u.username}
                onClick={() => { setUsername(u.username); setPassword('1234') }}
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 14px',
                  background: C.cardBg, transition: 'border-color 0.15s',
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>{u.label}</Text>
                    <Text style={{ fontSize: 12, color: C.textMuted }}>
                      usuario: <strong style={{ color: C.textSecondary }}>{u.username}</strong> · clave: 1234
                    </Text>
                  </div>
                  <IconArrowRight size={14} color={C.textSubtle} />
                </Group>
              </UnstyledButton>
            ))}
          </Stack>

        </Box>
      </div>
    </div>
  )
}
