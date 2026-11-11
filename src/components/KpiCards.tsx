import { memo } from 'react'
import { formatCop, formatKw } from '../utils/format'
import { Card } from './ui/card'
import { Skeleton } from './ui/feedback'

interface Kpis {
  total: number
  pendiente: number
  en_progreso: number
  completado: number
  kwTotales: number
  costoMateriales: number
}

export const KpiCards = memo(function KpiCards({ kpis, isLoading }: { kpis: Kpis; isLoading: boolean }) {
  const items = [
    { label: 'Proyectos', value: String(kpis.total), sub: `${kpis.completado} completados` },
    { label: 'Pendientes', value: String(kpis.pendiente), sub: 'por iniciar' },
    { label: 'En progreso', value: String(kpis.en_progreso), sub: 'en instalación' },
    { label: 'Capacidad total', value: formatKw(kpis.kwTotales), sub: 'potencia instalada/planeada' },
    { label: 'Materiales', value: formatCop(kpis.costoMateriales), sub: 'costo asignado (RN-6)' },
  ]
  return (
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((k, i) =>
        i === 0 ? (
          // Tarjeta destacada: no usa <Card> porque su bg-white entraría en conflicto con bg-slate-900
          <div key={k.label} className="rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
            <p className="text-xs font-medium text-slate-300">{k.label}</p>
            {isLoading ? <Skeleton className="mt-2 h-7 w-20 bg-slate-700" /> : <p className="mt-1 truncate text-2xl font-bold tracking-tight">{k.value}</p>}
            <p className="mt-0.5 text-xs text-slate-400">{k.sub}</p>
          </div>
        ) : (
          <Card key={k.label} className={`p-4 ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
            <p className="text-xs font-medium text-slate-500">{k.label}</p>
            {isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 truncate text-xl font-bold tracking-tight xl:text-2xl">{k.value}</p>}
            <p className="mt-0.5 text-xs text-slate-400">{k.sub}</p>
          </Card>
        ),
      )}
    </section>
  )
})
