import type { Enums, Tables, Views } from './database.types'

export type ProyectoEstado = Enums<'proyecto_estado'>
export type Certificacion = Enums<'certificacion'>
export type Rol = 'coordinador' | 'instalador'

export const ESTADOS: readonly ProyectoEstado[] = ['pendiente', 'en_progreso', 'completado'] as const

/** Fila de la vista v_proyectos_resumen, normalizada (los campos de una vista llegan como nullable). */
export interface ProyectoResumen {
  id: string
  nombre: string
  cliente: string
  ciudad: string
  capacidadKw: number
  estado: ProyectoEstado
  fechaInicio: string
  fechaFinEstimada: string
  instaladorId: string | null
  instaladorNombre: string | null
  costoMateriales: number
  totalMateriales: number
  updatedAt: string
}

export type Instalador = Pick<Tables<'instaladores'>, 'id' | 'nombre' | 'email' | 'certificacion' | 'activo'>
export type Material = Pick<Tables<'materiales'>, 'id' | 'nombre' | 'sku' | 'unidad' | 'costo_unitario' | 'stock'>

export interface NuevoProyecto {
  nombre: string
  cliente: string
  ciudad: string
  direccion: string | null
  capacidadKw: number
  fechaInicio: string
  fechaFinEstimada: string
  instaladorId: string | null
}

export interface Sesion {
  userId: string
  nombre: string
  rol: Rol
  /** id en la tabla instaladores (solo si rol = instalador) */
  instaladorId: string | null
}

export function toProyectoResumen(row: Views<'v_proyectos_resumen'>): ProyectoResumen {
  return {
    id: row.id ?? '',
    nombre: row.nombre ?? '',
    cliente: row.cliente ?? '',
    ciudad: row.ciudad ?? '',
    capacidadKw: Number(row.capacidad_kw ?? 0),
    estado: row.estado ?? 'pendiente',
    fechaInicio: row.fecha_inicio ?? '',
    fechaFinEstimada: row.fecha_fin_estimada ?? '',
    instaladorId: row.instalador_id,
    instaladorNombre: row.instalador_nombre,
    costoMateriales: Number(row.costo_materiales ?? 0),
    totalMateriales: Number(row.total_materiales ?? 0),
    updatedAt: row.updated_at ?? '',
  }
}

export const siguienteEstado = (e: ProyectoEstado): ProyectoEstado | null =>
  e === 'pendiente' ? 'en_progreso' : e === 'en_progreso' ? 'completado' : null
