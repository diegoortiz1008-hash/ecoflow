import type { Instalador, Material, NuevoProyecto, ProyectoEstado, ProyectoResumen, Sesion } from '../types/domain'

/**
 * Contrato de acceso a datos. Los hooks dependen de esta interfaz, no de supabase-js:
 * así funcionan igual con Supabase real o con el repositorio de demostración.
 */
export interface EcoFlowRepository {
  readonly modo: 'supabase' | 'demo'
  getSesion(): Promise<Sesion | null>
  listProyectos(): Promise<ProyectoResumen[]>
  crearProyecto(input: NuevoProyecto): Promise<ProyectoResumen>
  cambiarEstado(id: string, estado: ProyectoEstado): Promise<ProyectoResumen>
  listInstaladores(): Promise<Instalador[]>
  listMateriales(): Promise<Material[]>
}

/** Error con código estilo Postgres, para que toUserMessage lo traduzca igual en ambos modos. */
export class RepoError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}
