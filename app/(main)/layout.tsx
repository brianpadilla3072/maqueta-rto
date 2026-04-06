'use client'
import { AppShell } from '@mantine/core'
import { RoleProvider } from '@/contexts/RoleContext'
import NavBar from '@/components/NavBar'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
        <AppShell.Navbar>
          <NavBar />
        </AppShell.Navbar>
        <AppShell.Main bg="gray.0">
          {children}
        </AppShell.Main>
      </AppShell>
    </RoleProvider>
  )
}
