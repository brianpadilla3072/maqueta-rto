'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Rol } from './RoleContext'

export interface AuthUser {
  username: string
  label: string
  rol: Rol
}

interface AuthContextType {
  user: AuthUser | null
  ready: boolean
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  ready: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('rto-session')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setReady(true)
  }, [])

  const login = (u: AuthUser) => {
    localStorage.setItem('rto-session', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('rto-session')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
