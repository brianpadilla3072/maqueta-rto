'use client'
import { MantineProvider, createTheme, localStorageColorSchemeManager } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from '@/contexts/AuthContext'
import { ReactNode } from 'react'

const colorSchemeManager = localStorageColorSchemeManager({ key: 'rto-color-scheme' })

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: "'Inter', system-ui, sans-serif",
  defaultRadius: 'md',
  headings: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: '600',
  },
  components: {
    Button:        { defaultProps: { radius: 'md' } },
    Card:          { defaultProps: { radius: 'lg' } },
    TextInput:     { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select:        { defaultProps: { radius: 'md' } },
  },
})

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="light"
    >
      <Notifications position="top-right" zIndex={9999} />
      <AuthProvider>
        {children}
      </AuthProvider>
    </MantineProvider>
  )
}
