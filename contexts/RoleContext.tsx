'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Rol = 'Público' | 'Técnico' | 'Cajera' | 'Director'

interface RoleContextType {
  rol: Rol
  setRol: (r: Rol) => void
}

const RoleContext = createContext<RoleContextType>({ rol: 'Director', setRol: () => {} })

export function RoleProvider({ children }: { children: ReactNode }) {
  const [rol, setRol] = useState<Rol>('Director')

  useEffect(() => {
    const stored = localStorage.getItem('rto-session')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user.rol) setRol(user.rol as Rol)
      } catch { /* ignore */ }
    }
  }, [])

  return <RoleContext.Provider value={{ rol, setRol }}>{children}</RoleContext.Provider>
}

export const useRol = () => useContext(RoleContext)
