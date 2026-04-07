// ── Helpers del Turnero ──────────────────────────────────────────
import type { TipoFinal } from './types'

export const ANO_ACTUAL = 2026

export function calcularVigencia(tipo: TipoFinal, cp: boolean, anio: number): string {
  const edad = ANO_ACTUAL - anio
  if (tipo === 'CARGA' && cp)  return edad < 10 ? '1 año'  : '4 meses'
  if (tipo === 'CARGA' && !cp) return edad < 10 ? '1 año'  : '6 meses'
  if (tipo === 'PARTICULAR')   return edad < 7  ? '2 años' : '1 año'
  if (tipo === 'PASAJEROS')    return edad < 10 ? '6 meses': '4 meses'
  return '1 año'
}

export function calcularPrecio(tipo: TipoFinal, cp: boolean): number {
  if (tipo === 'CARGA' && cp) return 15000
  if (tipo === 'PASAJEROS')   return 13000
  return 12000
}

export const PROVINCIAS_RESTRINGIDAS = ['Buenos Aires', 'Mendoza', 'CABA']
