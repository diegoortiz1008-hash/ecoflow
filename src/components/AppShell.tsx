import type { ReactNode } from 'react'
import type { Sesion } from '../types/domain'
import { Badge } from './ui/badge'

interface Props {
  sesion: Sesion
  modo: 'supabase' | 'demo'
  usuariosDemo?: Sesion[]
  onCambiarUsuario?: (userId: string) => void
  children: ReactNode
}

export function AppShell({ sesion, modo, usuariosDemo, onCambiarUsuario, children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="text-lg font-bold text-emerald-700">☀️ EcoFlow</span>
          <span className="hidden text-sm text-slate-400 sm:inline">Gestión de instalaciones solares</span>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={sesion.rol === 'coordinador' ? 'completado' : 'en_progreso'}>{sesion.rol === 'coordinador' ? 'Coordinador' : 'Instalador'}</Badge>
            {modo === 'demo' && usuariosDemo && onCambiarUsuario ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="hidden sm:inline">Sesión demo:</span>
                <select
                  value={sesion.userId}
                  onChange={(e) => onCambiarUsuario(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  aria-label="Cambiar usuario de demostración"
                >
                  {usuariosDemo.map((u) => <option key={u.userId} value={u.userId}>{u.nombre}</option>)}
                </select>
              </label>
            ) : (
              <span className="text-sm font-medium text-slate-700">{sesion.nombre}</span>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {sesion.rol === 'coordinador' ? 'Todos los proyectos' : `Mis proyectos asignados`}
          </h1>
          <p className="text-sm text-slate-500">
            {sesion.rol === 'coordinador'
              ? 'Vista completa: puedes crear, asignar y reabrir proyectos.'
              : 'Solo ves los proyectos asignados a ti (RLS) y puedes avanzar su estado.'}
            {modo === 'demo' && ' · Modo demo con datos de supabase/seed.sql'}
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}
