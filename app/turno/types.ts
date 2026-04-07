// ── Tipos del Turnero ────────────────────────────────────────────

export type CategoriaVehiculo = 'N1_SEDAN' | 'N1_PICKUP' | 'N2_N3' | 'M1' | 'M2' | 'M3'
export type TipoFinal = 'CARGA' | 'PARTICULAR' | 'PASAJEROS'

export type Step =
  // Identificación
  | 'patente'
  | 'cta_eleccion'
  | 'datos'
  | 'reverificacion'
  | 'condicional_bloqueado'
  // Cuenta corriente
  | 'cta_turno'
  // Clasificación
  | 'tipo_vehiculo'
  | 'provincia'
  | 'bloqueado_jurisdiccion'
  | 'n1_uso'
  | 'carga_peligrosa'
  | 'aviso_vigencia'
  | 'pasajeros_tacografo'
  | 'pasajeros_cedula_uso'
  | 'pasajeros_0km'
  // Validaciones
  | 'advertencia_polarizados'
  | 'advertencia_polarizados_aviso'
  | 'advertencia_reflectivas'
  | 'bandas_obs'
  // Documentación
  | 'documentacion_cedula'
  | 'documentacion_rto'
  | 'rto_presentar'
  // Facturación
  | 'facturacion_titular'
  | 'facturacion_tercero'
  // Cierre
  | 'fecha_hora'
  | 'confirmacion'
