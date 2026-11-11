// Borrador de tipos generado por la IA SOLO a partir de docs/ESPECIFICACION_TECNICA.md
// (antes de existir la base de datos). Se conserva para la comparación del informe.
export type ProyectoEstado = 'pendiente' | 'en_progreso' | 'completado'
export type Certificacion = 'basica' | 'avanzada' | 'experto'
export type UnidadMaterial = 'unidad' | 'metro' | 'kg'

export interface Database {
  public: {
    Tables: {
      instaladores: {
        Row: {
          id: string
          user_id: string
          nombre: string
          email: string
          telefono: string
          certificacion: Certificacion
          activo: boolean
          created_at: string
        }
      }
      proyectos: {
        Row: {
          id: string
          nombre: string
          cliente: string
          ciudad: string
          direccion: string
          capacidad_kw: number
          estado: ProyectoEstado
          fecha_inicio: Date
          fecha_fin_estimada: Date
          instalador_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
      }
      materiales: {
        Row: {
          id: string
          nombre: string
          sku: string
          unidad: UnidadMaterial
          costo_unitario: number
          stock: number
        }
      }
      proyecto_materiales: {
        Row: { proyecto_id: string; material_id: string; cantidad: number }
      }
    }
  }
}
