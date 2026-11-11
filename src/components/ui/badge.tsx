import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  pendiente: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  en_progreso: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  completado: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
} as const

export function Badge({ variant = 'neutral', className, ...p }: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', variants[variant], className)} {...p} />
}
