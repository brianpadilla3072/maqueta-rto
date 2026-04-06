'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

export type Rol = 'Público' | 'Técnico' | 'Cajera' | 'Director'

interface RoleContextType {
  rol: Rol
  setRol: (r: Rol) => void
}

const RoleContext = createContext<RoleContextType>({ rol: 'Director', setRol: () => {} })

export function RoleProvider({ children }: { children: ReactNode }) {
  const [rol, setRol] = useState<Rol>('Director')
  return <RoleContext.Provider value={{ rol, setRol }}>{children}</RoleContext.Provider>
}

export const useRol = () => useContext(RoleContext)
