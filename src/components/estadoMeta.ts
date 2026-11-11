import type { ProyectoEstado } from '../types/domain'

export const ESTADO_META: Record<ProyectoEstado, { label: string; icon: string; accion: string }> = {
  pendiente: { label: 'Pendiente', icon: '🕒', accion: 'Iniciar' },
  en_progreso: { label: 'En progreso', icon: '🔧', accion: 'Completar' },
  completado: { label: 'Completado', icon: '✅', accion: '' },
}
