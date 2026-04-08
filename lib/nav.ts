export type Rol = 'Público' | 'Técnico' | 'Cajera' | 'Director'

export interface NavItem {
  href: string
  label: string
  roles: Rol[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Inicio',         roles: ['Público', 'Técnico', 'Cajera', 'Director'] },
  { href: '/caja',      label: 'Caja',           roles: ['Cajera', 'Director'] },
  { href: '/tecnico',   label: 'Técnico',        roles: ['Técnico', 'Director'] },
  { href: '/config',    label: 'Administración', roles: ['Director'] },
]
