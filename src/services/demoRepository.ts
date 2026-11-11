import { siguienteEstado, type Instalador, type Material, type ProyectoEstado, type ProyectoResumen, type Sesion } from '../types/domain'
import { RepoError, type EcoFlowRepository } from './repository'

/**
 * Repositorio EN MEMORIA para demo y tests. Reproduce las mismas reglas que la BD
 * (RLS SEG-2/SEG-3 y RN-1..RN-5) para que la UI se comporte igual que con Supabase.
 * Datos = supabase/seed.sql.
 */
export const DEMO_USUARIOS: Sesion[] = [
  { userId: 'u-coord', nombre: 'Coordinación EcoFlow', rol: 'coordinador', instaladorId: null },
  { userId: 'u-ana', nombre: 'Ana Ríos', rol: 'instalador', instaladorId: 'i-ana' },
  { userId: 'u-bruno', nombre: 'Bruno Díaz', rol: 'instalador', instaladorId: 'i-bruno' },
]

const INSTALADORES: Instalador[] = [
  { id: 'i-ana', nombre: 'Ana Ríos', email: 'ana.rios@ecoflow.co', certificacion: 'experto', activo: true },
  { id: 'i-bruno', nombre: 'Bruno Díaz', email: 'bruno.diaz@ecoflow.co', certificacion: 'avanzada', activo: true },
  { id: 'i-carla', nombre: 'Carla Gómez', email: 'carla.gomez@ecoflow.co', certificacion: 'basica', activo: false },
]

const MATERIALES: Material[] = [
  { id: 'm-1', nombre: 'Panel monocristalino 550 W', sku: 'PNL-550M', unidad: 'unidad', costo_unitario: 780000, stock: 420 },
  { id: 'm-2', nombre: 'Inversor híbrido 10 kW', sku: 'INV-10KH', unidad: 'unidad', costo_unitario: 6900000, stock: 35 },
  { id: 'm-3', nombre: 'Estructura de aluminio', sku: 'EST-AL-01', unidad: 'metro', costo_unitario: 95000, stock: 1200 },
  { id: 'm-4', nombre: 'Cable solar 6 mm²', sku: 'CBL-6MM', unidad: 'metro', costo_unitario: 7800, stock: 5000 },
]

const seed = (): ProyectoResumen[] => [
  { id: 'p-1', nombre: 'Techo solar bodega norte', cliente: 'Logística Andina S.A.S.', ciudad: 'Bogotá', capacidadKw: 120, estado: 'en_progreso', fechaInicio: '2026-10-20', fechaFinEstimada: '2026-11-30', instaladorId: 'i-ana', instaladorNombre: 'Ana Ríos', costoMateriales: 220 * 780000 + 12 * 6900000, totalMateriales: 2, updatedAt: '2026-11-01T10:00:00Z' },
  { id: 'p-2', nombre: 'Granja solar El Llano', cliente: 'Agro Meta Ltda.', ciudad: 'Villavicencio', capacidadKw: 850, estado: 'pendiente', fechaInicio: '2026-12-01', fechaFinEstimada: '2027-03-15', instaladorId: 'i-bruno', instaladorNombre: 'Bruno Díaz', costoMateriales: 0, totalMateriales: 0, updatedAt: '2026-11-02T10:00:00Z' },
  { id: 'p-3', nombre: 'Colegio San Martín', cliente: 'Fundación Educar', ciudad: 'Medellín', capacidadKw: 45.5, estado: 'completado', fechaInicio: '2026-08-01', fechaFinEstimada: '2026-09-10', instaladorId: 'i-ana', instaladorNombre: 'Ana Ríos', costoMateriales: 84 * 780000 + 160 * 95000, totalMateriales: 2, updatedAt: '2026-09-10T10:00:00Z' },
  { id: 'p-4', nombre: 'Clínica Costa Azul', cliente: 'Salud Caribe S.A.', ciudad: 'Barranquilla', capacidadKw: 210, estado: 'pendiente', fechaInicio: '2026-12-10', fechaFinEstimada: '2027-01-30', instaladorId: null, instaladorNombre: null, costoMateriales: 0, totalMateriales: 0, updatedAt: '2026-11-03T10:00:00Z' },
]

export interface DemoOptions {
  latency?: number
  getSesion: () => Sesion
}

export function createDemoRepository({ latency = 450, getSesion }: DemoOptions): EcoFlowRepository & { failNext: (code: string, msg: string) => void } {
  let proyectos = seed()
  let nextFailure: RepoError | null = null
  const wait = () => new Promise((r) => setTimeout(r, latency))
  const maybeFail = () => {
    if (nextFailure) {
      const e = nextFailure
      nextFailure = null
      throw e
    }
  }
  const visibles = () => {
    const s = getSesion()
    return s.rol === 'coordinador' ? proyectos : proyectos.filter((p) => p.instaladorId === s.instaladorId) // SEG-2
  }

  return {
    modo: 'demo',
    failNext(code, msg) {
      nextFailure = new RepoError(code, msg)
    },

    async getSesion() {
      return getSesion()
    },

    async listProyectos() {
      await wait()
      maybeFail()
      return visibles().map((p) => ({ ...p }))
    },

    async crearProyecto(input) {
      await wait()
      maybeFail()
      if (getSesion().rol !== 'coordinador') throw new RepoError('42501', 'new row violates row-level security policy')
      if (input.capacidadKw <= 0 || input.capacidadKw > 10_000) throw new RepoError('23514', 'RN-1: capacidad fuera de rango')
      if (input.fechaFinEstimada < input.fechaInicio) throw new RepoError('23514', 'RN-2: fechas inválidas')
      const inst = INSTALADORES.find((i) => i.id === input.instaladorId)
      if (input.instaladorId && !inst?.activo) throw new RepoError('23514', 'RN-5: el instalador asignado no existe o está inactivo')
      const nuevo: ProyectoResumen = {
        id: crypto.randomUUID(), ...input, estado: 'pendiente', instaladorNombre: inst?.nombre ?? null,
        costoMateriales: 0, totalMateriales: 0, updatedAt: new Date().toISOString(),
      }
      proyectos = [nuevo, ...proyectos]
      return { ...nuevo }
    },

    async cambiarEstado(id, estado: ProyectoEstado) {
      await wait()
      maybeFail()
      const s = getSesion()
      const p = visibles().find((x) => x.id === id)
      if (!p) throw new RepoError('PGRST116', 'JSON object requested, multiple (or no) rows returned')
      if (estado !== 'pendiente' && !p.instaladorId) throw new RepoError('23514', 'RN-3: un proyecto en progreso o completado requiere instalador')
      if (s.rol !== 'coordinador' && siguienteEstado(p.estado) !== estado)
        throw new RepoError('23514', `RN-4: transición de estado no permitida (${p.estado} -> ${estado})`)
      const actualizado = { ...p, estado, updatedAt: new Date().toISOString() }
      proyectos = proyectos.map((x) => (x.id === id ? actualizado : x))
      return { ...actualizado }
    },

    async listInstaladores() {
      await wait()
      const s = getSesion()
      return s.rol === 'coordinador' ? INSTALADORES : INSTALADORES.filter((i) => i.id === s.instaladorId)
    },

    async listMateriales() {
      await wait()
      return MATERIALES
    },
  }
}
