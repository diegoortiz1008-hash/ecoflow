// ⚠️ ARCHIVO GENERADO por scripts/gen-types.mjs a partir del esquema real de PostgreSQL.
// No editar a mano: regenerar con `npm run gen:types` (o `npx supabase gen types typescript --linked`).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      instaladores: {
        Row: {
          id: string
          user_id: string | null
          nombre: string
          email: string
          telefono: string | null
          certificacion: Database['public']['Enums']['certificacion']
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nombre: string
          email: string
          telefono?: string | null
          certificacion?: Database['public']['Enums']['certificacion']
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nombre?: string
          email?: string
          telefono?: string | null
          certificacion?: Database['public']['Enums']['certificacion']
          activo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      materiales: {
        Row: {
          id: string
          nombre: string
          sku: string
          unidad: Database['public']['Enums']['unidad_material']
          costo_unitario: number
          stock: number
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          sku: string
          unidad?: Database['public']['Enums']['unidad_material']
          costo_unitario: number
          stock?: number
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          sku?: string
          unidad?: Database['public']['Enums']['unidad_material']
          costo_unitario?: number
          stock?: number
          created_at?: string
        }
        Relationships: []
      }
      proyecto_materiales: {
        Row: {
          proyecto_id: string
          material_id: string
          cantidad: number
        }
        Insert: {
          proyecto_id: string
          material_id: string
          cantidad: number
        }
        Update: {
          proyecto_id?: string
          material_id?: string
          cantidad?: number
        }
        Relationships: []
      }
      proyectos: {
        Row: {
          id: string
          nombre: string
          cliente: string
          ciudad: string
          direccion: string | null
          capacidad_kw: number
          estado: Database['public']['Enums']['proyecto_estado']
          fecha_inicio: string
          fecha_fin_estimada: string
          instalador_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          cliente: string
          ciudad: string
          direccion?: string | null
          capacidad_kw: number
          estado?: Database['public']['Enums']['proyecto_estado']
          fecha_inicio: string
          fecha_fin_estimada: string
          instalador_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          cliente?: string
          ciudad?: string
          direccion?: string | null
          capacidad_kw?: number
          estado?: Database['public']['Enums']['proyecto_estado']
          fecha_inicio?: string
          fecha_fin_estimada?: string
          instalador_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_proyectos_resumen: {
        Row: {
          id: string | null
          nombre: string | null
          cliente: string | null
          ciudad: string | null
          capacidad_kw: number | null
          estado: Database['public']['Enums']['proyecto_estado'] | null
          fecha_inicio: string | null
          fecha_fin_estimada: string | null
          instalador_id: string | null
          instalador_nombre: string | null
          costo_materiales: number | null
          total_materiales: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_coordinador: { Args: Record<PropertyKey, never>; Returns: boolean }
      mi_instalador_id: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: {
      certificacion: 'basica' | 'avanzada' | 'experto'
      proyecto_estado: 'pendiente' | 'en_progreso' | 'completado'
      unidad_material: 'unidad' | 'metro' | 'kg'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]
