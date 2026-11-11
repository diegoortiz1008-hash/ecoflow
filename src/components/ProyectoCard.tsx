import { memo } from 'react'
import { siguienteEstado, type ProyectoEstado, type ProyectoResumen, type Rol } from '../types/domain'
import { formatCop, formatFecha, formatKw } from '../utils/format'
import { ESTADO_META } from './estadoMeta'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface Props {
  proyecto: ProyectoResumen
  rol: Rol
  pendiente: boolean
  onCambiarEstado: (id: string, estado: ProyectoEstado) => void
}

/** Presentacional: recibe datos y callbacks, no conoce Supabase. */
export const ProyectoCard = memo(function ProyectoCard({ proyecto: p, rol, pendiente, onCambiarEstado }: Props) {
  const siguiente = siguienteEstado(p.estado)
  return (
    <Card aria-busy={pendiente} className={`p-4 transition ${pendiente ? 'opacity-60' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-2">
        <Badge variant={p.estado}>{ESTADO_META[p.estado].icon} {ESTADO_META[p.estado].label}</Badge>
        <span className="text-xs font-semibold text-slate-700">{formatKw(p.capacidadKw)}</span>
      </div>
      <h3 className="mt-2 font-semibold leading-snug text-slate-900">{p.nombre}</h3>
      <p className="text-sm text-slate-500">{p.cliente} · {p.ciudad}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-slate-500">Instalador</dt>
        <dd className={`text-right font-medium ${p.instaladorNombre ? 'text-slate-800' : 'text-amber-700'}`}>{p.instaladorNombre ?? 'Sin asignar'}</dd>
        <dt className="text-slate-500">Fechas</dt>
        <dd className="text-right text-slate-800">{formatFecha(p.fechaInicio)} → {formatFecha(p.fechaFinEstimada)}</dd>
        <dt className="text-slate-500">Materiales</dt>
        <dd className="text-right text-slate-800">{p.totalMateriales > 0 ? formatCop(p.costoMateriales) : '—'}</dd>
      </dl>

      {siguiente && (
        <div className="mt-3 flex gap-2">
          {/* RN-3: sin instalador no se puede iniciar; se previene en la UI (la BD lo vuelve a validar) */}
          <Button
            size="sm"
            className="flex-1"
            disabled={pendiente || !p.instaladorId}
            title={!p.instaladorId ? 'Asigna un instalador antes de iniciar (RN-3)' : undefined}
            onClick={() => onCambiarEstado(p.id, siguiente)}
          >
            {pendiente ? 'Guardando…' : !p.instaladorId ? 'Requiere instalador' : `${ESTADO_META[p.estado].accion} →`}
          </Button>
          {rol === 'coordinador' && p.estado !== 'pendiente' && (
            <Button size="sm" variant="outline" disabled={pendiente} onClick={() => onCambiarEstado(p.id, 'pendiente')} title="Solo coordinador">
              Reabrir
            </Button>
          )}
        </div>
      )}
    </Card>
  )
})
