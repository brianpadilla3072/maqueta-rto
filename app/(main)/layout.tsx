'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { RoleProvider, useRol } from '@/contexts/RoleContext'
import { useAuth } from '@/contexts/AuthContext'
import AppFrame from '@/components/AppFrame'
import { NAV_ITEMS } from '@/lib/nav'
import type { ReactNode } from 'react'

function Guard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user])

  if (!ready || !user) return null
  return <>{children}</>
}

function PermissionGuard({ children }: { children: ReactNode }) {
  const { rol } = useRol()
  const pathname = usePathname()

  const item = NAV_ITEMS.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))
  const allowed = !item || item.roles.includes(rol)

  if (!allowed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
        <p>No tienes permiso para ver esta sección.</p>
      </div>
    )
  }
  return <>{children}</>
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <Guard>
        <AppFrame>
          <PermissionGuard>{children}</PermissionGuard>
        </AppFrame>
      </Guard>
    </RoleProvider>
  )
}
