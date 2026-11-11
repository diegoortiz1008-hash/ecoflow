import { describe, expect, it } from 'vitest'
import type { Instalador } from '../types/domain'
import { EMPTY_PROYECTO, validateProyecto, type ProyectoFormValues } from './validation'

const instaladores: Instalador[] = [
  { id: 'i-ana', nombre: 'Ana Ríos', email: 'ana@x.co', certificacion: 'experto', activo: true },
  { id: 'i-carla', nombre: 'Carla Gómez', email: 'carla@x.co', certificacion: 'basica', activo: false },
]

const valido: ProyectoFormValues = {
  ...EMPTY_PROYECTO,
  nombre: '  Techo solar planta sur ',
  cliente: 'Metales del Valle',
  ciudad: 'Cali',
  capacidadKw: '75,5',
  fechaInicio: '2026-12-01',
  fechaFinEstimada: '2027-01-15',
  instaladorId: 'i-ana',
}

describe('validateProyecto (réplica en cliente de RN-1, RN-2, RN-5)', () => {
  it('acepta un proyecto válido, recorta espacios y convierte la coma decimal', () => {
    const { errors, data } = validateProyecto(valido, instaladores)
    expect(errors).toEqual({})
    expect(data).toMatchObject({ nombre: 'Techo solar planta sur', capacidadKw: 75.5, direccion: null, instaladorId: 'i-ana' })
  })

  it('exige los campos obligatorios', () => {
    const { errors, data } = validateProyecto(EMPTY_PROYECTO, instaladores)
    expect(data).toBeUndefined()
    expect(Object.keys(errors).sort()).toEqual(['capacidadKw', 'ciudad', 'cliente', 'fechaFinEstimada', 'fechaInicio', 'nombre'])
  })

  it.each([['0'], ['-5'], ['10000.01'], ['abc']])('RN-1: rechaza capacidad %s', (kw) => {
    expect(validateProyecto({ ...valido, capacidadKw: kw }, instaladores).errors.capacidadKw).toBeDefined()
  })

  it('RN-1: acepta exactamente 10.000 kW y rechaza más de 2 decimales', () => {
    expect(validateProyecto({ ...valido, capacidadKw: '10000' }, instaladores).errors.capacidadKw).toBeUndefined()
    expect(validateProyecto({ ...valido, capacidadKw: '1.234' }, instaladores).errors.capacidadKw).toMatch(/decimales/)
  })

  it('RN-2: la fecha fin no puede ser anterior al inicio (igual sí se permite)', () => {
    expect(validateProyecto({ ...valido, fechaFinEstimada: '2026-11-30' }, instaladores).errors.fechaFinEstimada).toMatch(/RN-2/)
    expect(validateProyecto({ ...valido, fechaFinEstimada: '2026-12-01' }, instaladores).errors.fechaFinEstimada).toBeUndefined()
  })

  it('RN-5: no permite asignar un instalador inactivo', () => {
    expect(validateProyecto({ ...valido, instaladorId: 'i-carla' }, instaladores).errors.instaladorId).toMatch(/inactivo/)
  })

  it('el instalador es opcional (el proyecto nace pendiente)', () => {
    expect(validateProyecto({ ...valido, instaladorId: '' }, instaladores).data?.instaladorId).toBeNull()
  })
})
