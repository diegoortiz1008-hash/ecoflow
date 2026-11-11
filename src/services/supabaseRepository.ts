import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import { toProyectoResumen, type Rol } from '../types/domain'
import { RepoError, type EcoFlowRepository } from './repository'

const RESUMEN_COLS =
  'id, nombre, cliente, ciudad, capacidad_kw, estado, fecha_inicio, fecha_fin_estimada, instalador_id, instalador_nombre, costo_materiales, total_materiales, updated_at'

const fail = (e: { code?: string; message: string }): never => {
  throw new RepoError(e.code ?? 'unknown', e.message)
}

export function createSupabaseRepository(client: SupabaseClient<Database>): EcoFlowRepository {
  const resumenDe = async (id: string) => {
    const { data, error } = await client.from('v_proyectos_resumen').select(RESUMEN_COLS).eq('id', id).single()
    if (error) fail(error)
    return toProyectoResumen(data!)
  }

  return {
    modo: 'supabase',

    async getSesion() {
      const { data } = await client.auth.getUser()
      const user = data.user
      if (!user) return null
      const rol: Rol = user.app_metadata?.role === 'coordinador' ? 'coordinador' : 'instalador' // SEG-1
      const { data: inst } = await client.from('instaladores').select('id, nombre').eq('user_id', user.id).maybeSingle()
      return { userId: user.id, nombre: inst?.nombre ?? user.email ?? 'Usuario', rol, instaladorId: inst?.id ?? null }
    },

    async listProyectos() {
      // RLS filtra en la BD: el instalador solo recibe sus proyectos (SEG-2)
      const { data, error } = await client.from('v_proyectos_resumen').select(RESUMEN_COLS).order('fecha_inicio', { ascending: false })
      if (error) fail(error)
      return (data ?? []).map(toProyectoResumen)
    },

    async crearProyecto(p) {
      const { data, error } = await client
        .from('proyectos')
        .insert({
          nombre: p.nombre,
          cliente: p.cliente,
          ciudad: p.ciudad,
          direccion: p.direccion,
          capacidad_kw: p.capacidadKw,
          fecha_inicio: p.fechaInicio,
          fecha_fin_estimada: p.fechaFinEstimada,
          instalador_id: p.instaladorId,
        })
        .select('id')
        .single()
      if (error) fail(error)
      return resumenDe(data!.id)
    },

    async cambiarEstado(id, estado) {
      const { error } = await client.from('proyectos').update({ estado }).eq('id', id).select('id').single()
      if (error) fail(error)
      return resumenDe(id)
    },

    async listInstaladores() {
      const { data, error } = await client.from('instaladores').select('id, nombre, email, certificacion, activo').order('nombre')
      if (error) fail(error)
      return data ?? []
    },

    async listMateriales() {
      const { data, error } = await client.from('materiales').select('id, nombre, sku, unidad, costo_unitario, stock').order('nombre')
      if (error) fail(error)
      return data ?? []
    },
  }
}
