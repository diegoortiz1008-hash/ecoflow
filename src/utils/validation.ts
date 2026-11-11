import type { Instalador, NuevoProyecto } from '../types/domain'

export interface ProyectoFormValues {
  nombre: string
  cliente: string
  ciudad: string
  direccion: string
  capacidadKw: string
  fechaInicio: string
  fechaFinEstimada: string
  instaladorId: string
}

export type ProyectoFormErrors = Partial<Record<keyof ProyectoFormValues, string>>

export const EMPTY_PROYECTO: ProyectoFormValues = {
  nombre: '', cliente: '', ciudad: '', direccion: '', capacidadKw: '', fechaInicio: '', fechaFinEstimada: '', instaladorId: '',
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Replica en el cliente las reglas de la BD (RN-1, RN-2, RN-5) para dar feedback inmediato.
 * La BD las vuelve a aplicar: el cliente nunca es la única defensa.
 */
export function validateProyecto(
  v: ProyectoFormValues,
  instaladores: Instalador[],
): { errors: ProyectoFormErrors; data?: NuevoProyecto } {
  const e: ProyectoFormErrors = {}
  const len = (s: string) => s.trim().length

  if (len(v.nombre) < 3 || len(v.nombre) > 150) e.nombre = 'Entre 3 y 150 caracteres.'
  if (len(v.cliente) < 2 || len(v.cliente) > 150) e.cliente = 'Entre 2 y 150 caracteres.'
  if (len(v.ciudad) < 2 || len(v.ciudad) > 80) e.ciudad = 'Entre 2 y 80 caracteres.'
  if (v.direccion.length > 250) e.direccion = 'Máximo 250 caracteres.'

  const kw = Number(v.capacidadKw.replace(',', '.'))
  if (v.capacidadKw.trim() === '' || Number.isNaN(kw)) e.capacidadKw = 'Ingresa un número.'
  else if (kw <= 0 || kw > 10_000) e.capacidadKw = 'Debe estar entre 0 y 10.000 kW (RN-1).'
  else if (Math.round(kw * 100) !== kw * 100) e.capacidadKw = 'Máximo 2 decimales.'

  if (!ISO_DATE.test(v.fechaInicio)) e.fechaInicio = 'Fecha obligatoria.'
  if (!ISO_DATE.test(v.fechaFinEstimada)) e.fechaFinEstimada = 'Fecha obligatoria.'
  else if (ISO_DATE.test(v.fechaInicio) && v.fechaFinEstimada < v.fechaInicio)
    e.fechaFinEstimada = 'No puede ser anterior al inicio (RN-2).'

  if (v.instaladorId) {
    const inst = instaladores.find((i) => i.id === v.instaladorId)
    if (!inst) e.instaladorId = 'Instalador no encontrado.'
    else if (!inst.activo) e.instaladorId = `${inst.nombre} está inactivo (RN-5).`
  }

  if (Object.keys(e).length > 0) return { errors: e }
  return {
    errors: e,
    data: {
      nombre: v.nombre.trim(),
      cliente: v.cliente.trim(),
      ciudad: v.ciudad.trim(),
      direccion: v.direccion.trim() || null,
      capacidadKw: kw,
      fechaInicio: v.fechaInicio,
      fechaFinEstimada: v.fechaFinEstimada,
      instaladorId: v.instaladorId || null,
    },
  }
}
