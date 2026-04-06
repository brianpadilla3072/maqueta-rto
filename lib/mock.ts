export type EstadoCola = 'EN_ESPERA' | 'INGRESO' | 'EN_REVISION' | 'FINALIZADO'
export type MedioPago = 'Efectivo' | 'Posnet' | 'Transferencia'

export interface Vehiculo {
  patente: string
  titular: string
  cuit: string
  condicionIva: string
  tipo: string
  peligrosa: boolean
  anio: number
  jurisdiccion: string
  ultimaRevision: string
  vencimiento: string
  condicional: boolean
  diasCondicional?: number
}

export interface ColaItem {
  id: string
  patente: string
  titular: string
  tipo: string
  prioridad: 'CON_TURNO' | 'SIN_TURNO'
  estado: EstadoCola
  linea: number
  orden: number
}

export interface Cobro {
  id: string
  patente: string
  titular: string
  monto: number
  medio: MedioPago
  estado: 'PAGADO' | 'PENDIENTE_VALIDACION' | 'RECHAZADO'
  hora: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'TECNICO' | 'CAJERA' | 'DIRECTOR'
  linea?: number
  activo: boolean
}

// ── Vehículos con historial ──────────────────────────────────────
export const vehiculos: Vehiculo[] = [
  {
    patente: 'ABC 123',
    titular: 'Juan Pérez',
    cuit: '20-12345678-9',
    condicionIva: 'Consumidor final',
    tipo: 'Carga',
    peligrosa: true,
    anio: 2016,
    jurisdiccion: 'Buenos Aires',
    ultimaRevision: '12/04/2025',
    vencimiento: '12/04/2026',
    condicional: false,
  },
  {
    patente: 'DEF 456',
    titular: 'Transener SA',
    cuit: '30-87654321-4',
    condicionIva: 'Responsable inscripto',
    tipo: 'Carga',
    peligrosa: false,
    anio: 2019,
    jurisdiccion: 'La Pampa',
    ultimaRevision: '03/10/2025',
    vencimiento: '03/10/2026',
    condicional: false,
  },
  {
    patente: 'GHI 789',
    titular: 'Carlos Rodríguez',
    cuit: '20-98765432-1',
    condicionIva: 'Consumidor final',
    tipo: 'Particular',
    peligrosa: false,
    anio: 2013,
    jurisdiccion: 'Buenos Aires',
    ultimaRevision: '15/01/2026',
    vencimiento: '15/01/2027',
    condicional: true,
    diasCondicional: 35,
  },
  {
    patente: 'JKL 012',
    titular: 'Cargill SA',
    cuit: '30-11223344-5',
    condicionIva: 'Responsable inscripto',
    tipo: 'Carga',
    peligrosa: true,
    anio: 2018,
    jurisdiccion: 'Río Negro',
    ultimaRevision: '20/08/2025',
    vencimiento: '20/08/2026',
    condicional: false,
  },
  {
    patente: 'MNO 345',
    titular: 'Roberto Silva',
    cuit: '20-55443322-7',
    condicionIva: 'Consumidor final',
    tipo: 'Carga',
    peligrosa: false,
    anio: 2020,
    jurisdiccion: 'Neuquén',
    ultimaRevision: '05/11/2025',
    vencimiento: '05/11/2026',
    condicional: false,
  },
]

// ── Cola activa del día ──────────────────────────────────────────
export const colaInicial: ColaItem[] = [
  { id: '1', patente: 'ABC 123', titular: 'Juan Pérez', tipo: 'Carga peligrosa', prioridad: 'CON_TURNO', estado: 'EN_REVISION', linea: 1, orden: 1 },
  { id: '2', patente: 'DEF 456', titular: 'Transener SA', tipo: 'Carga común', prioridad: 'CON_TURNO', estado: 'EN_ESPERA', linea: 1, orden: 2 },
  { id: '3', patente: 'MNO 345', titular: 'Roberto Silva', tipo: 'Carga común', prioridad: 'SIN_TURNO', estado: 'EN_ESPERA', linea: 1, orden: 3 },
  { id: '4', patente: 'JKL 012', titular: 'Cargill SA', tipo: 'Carga peligrosa', prioridad: 'CON_TURNO', estado: 'EN_ESPERA', linea: 2, orden: 1 },
  { id: '5', patente: 'PQR 678', titular: 'Marcelo Torres', tipo: 'Particular', prioridad: 'SIN_TURNO', estado: 'EN_ESPERA', linea: 2, orden: 2 },
]

// ── Cobros del día ───────────────────────────────────────────────
export const cobrosIniciales: Cobro[] = [
  { id: '1', patente: 'STU 901', titular: 'Luis Fernández', monto: 12000, medio: 'Efectivo', estado: 'PAGADO', hora: '08:15' },
  { id: '2', patente: 'VWX 234', titular: 'Ana Gómez', monto: 12000, medio: 'Posnet', estado: 'PAGADO', hora: '08:40' },
  { id: '3', patente: 'YZA 567', titular: 'Pedro Martínez', monto: 15000, medio: 'Efectivo', estado: 'PAGADO', hora: '09:00' },
  { id: '4', patente: 'ABC 123', titular: 'Juan Pérez', monto: 15000, medio: 'Transferencia', estado: 'PENDIENTE_VALIDACION', hora: '09:25' },
  { id: '5', patente: 'JKL 012', titular: 'Cargill SA', monto: 15000, medio: 'Transferencia', estado: 'PENDIENTE_VALIDACION', hora: '09:47' },
  { id: '6', patente: 'BCD 890', titular: 'Hugo Castillo', monto: 12000, medio: 'Efectivo', estado: 'PAGADO', hora: '10:10' },
  { id: '7', patente: 'EFG 123', titular: 'Norma Ríos', monto: 12000, medio: 'Posnet', estado: 'PAGADO', hora: '10:35' },
]

// ── Condicionales vencidos ────────────────────────────────────────
export const condicionalesVencidos = [
  { id: '1', patente: 'GHI 789', titular: 'Carlos Rodríguez', fechaCondicional: '01/03/2026', dias: 35 },
  { id: '2', patente: 'HIJ 456', titular: 'Miguel Ángel López', fechaCondicional: '15/02/2026', dias: 49 },
]

// ── Usuarios ─────────────────────────────────────────────────────
export const usuariosIniciales: Usuario[] = [
  { id: '1', nombre: 'Carlos García', email: 'carlos@taller.com', rol: 'TECNICO', linea: 1, activo: true },
  { id: '2', nombre: 'Roberto Díaz', email: 'roberto@taller.com', rol: 'TECNICO', linea: 2, activo: true },
  { id: '3', nombre: 'María López', email: 'maria@taller.com', rol: 'CAJERA', activo: true },
  { id: '4', nombre: 'Gerardo Taboada', email: 'gerardo@taller.com', rol: 'DIRECTOR', activo: true },
]

// ── Precios ──────────────────────────────────────────────────────
export const preciosIniciales = {
  'Carga peligrosa': 15000,
  'Carga común': 12000,
  'Particular': 12000,
  'Pasajeros M1': 11000,
  'Pasajeros M2': 13000,
  'Pasajeros M3': 14000,
}

// ── Horarios disponibles (slots de 20 min) ───────────────────────
export const slotsHorario = [
  '08:00', '08:20', '08:40',
  '09:00', '09:20', '09:40',
  '10:00', '10:20', '10:40',
  '11:00', '11:20', '11:40',
  '13:00', '13:20', '13:40',
  '14:00', '14:20', '14:40',
  '15:00', '15:20', '15:40',
  '16:00', '16:20', '16:40',
]

// Slots ya ocupados (simulado)
export const slotsOcupados = ['08:00', '08:20', '09:00', '10:00', '13:00', '14:00', '15:00']

export const formatPesos = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
