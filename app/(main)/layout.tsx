'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RoleProvider } from '@/contexts/RoleContext'
import { useAuth } from '@/contexts/AuthContext'
import AppFrame from '@/components/AppFrame'
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

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <Guard>
        <AppFrame>{children}</AppFrame>
      </Guard>
    </RoleProvider>
  )
}
