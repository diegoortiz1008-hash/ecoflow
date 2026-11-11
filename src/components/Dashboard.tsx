import { useState } from 'react'
import { useInstaladores } from '../hooks/useInstaladores'
import { useProyectos } from '../hooks/useProyectos'
import { ESTADOS, type Sesion } from '../types/domain'
import { ESTADO_META } from './estadoMeta'
import { KpiCards } from './KpiCards'
import { ProyectoCard } from './ProyectoCard'
import { ProyectoForm } from './ProyectoForm'
import { Button } from './ui/button'
import { EmptyState, ErrorState, Skeleton } from './ui/feedback'
import { Input, Select } from './ui/field'

/** UI-1: el componente solo orquesta hooks y presentación; no hay supabase-js aquí. */
export function Dashboard({ sesion }: { sesion: Sesion }) {
  const [filtros, setFiltros] = useState({ texto: '', ciudad: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const { porEstado, kpis, ciudades, isLoading, error, mutationError, pendientes, crearProyecto, cambiarEstado, reintentar, limpiarError } =
    useProyectos(sesion.userId, filtros)
  const { instaladores } = useInstaladores(sesion.userId)
  const esCoordinador = sesion.rol === 'coordinador'

  if (error) return <ErrorState message={error} onRetry={reintentar} />

  return (
    <div className="space-y-6">
      <KpiCards kpis={kpis} isLoading={isLoading} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label htmlFor="buscar" className="sr-only">Buscar</label>
        <Input id="buscar" placeholder="Buscar por proyecto o cliente…" value={filtros.texto} onChange={(e) => setFiltros((f) => ({ ...f, texto: e.target.value }))} className="md:max-w-sm" />
        <label htmlFor="ciudad" className="sr-only">Ciudad</label>
        <Select id="ciudad" value={filtros.ciudad} onChange={(e) => setFiltros((f) => ({ ...f, ciudad: e.target.value }))} className="md:w-48">
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => <option key={c}>{c}</option>)}
        </Select>
        {esCoordinador && !mostrarForm && (
          <Button className="md:ml-auto" onClick={() => setMostrarForm(true)}>+ Nuevo proyecto</Button>
        )}
      </div>

      {esCoordinador && mostrarForm && (
        <ProyectoForm instaladores={instaladores} onSubmit={crearProyecto} onCancel={() => setMostrarForm(false)} />
      )}

      {mutationError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800">
          <span>{mutationError} Se restauró el estado anterior.</span>
          <button type="button" className="font-medium underline" onClick={limpiarError}>Cerrar</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {ESTADOS.map((estado) => (
          <section key={estado} aria-labelledby={`col-${estado}`} className="rounded-2xl bg-slate-100/70 p-3">
            <h2 id={`col-${estado}`} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700">
              {ESTADO_META[estado].icon} {ESTADO_META[estado].label}
              <span className="ml-auto rounded-full bg-white px-2 text-xs text-slate-500">{isLoading ? '…' : porEstado[estado].length}</span>
            </h2>
            <div className="space-y-3">
              {isLoading && Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-44 bg-white" />)}
              {!isLoading && porEstado[estado].length === 0 && <EmptyState title="Sin proyectos" />}
              {!isLoading &&
                porEstado[estado].map((p) => (
                  <ProyectoCard key={p.id} proyecto={p} rol={sesion.rol} pendiente={Boolean(pendientes[p.id])} onCambiarEstado={cambiarEstado} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
