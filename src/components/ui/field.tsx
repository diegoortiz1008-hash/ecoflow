import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const control =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50'
const state = (error?: string) =>
  error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

/** Label + control + mensaje de error accesible (aria-describedby). */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ error, className, id, ...p }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn(control, state(error), className)} {...p} />
}

export function Select({ error, className, id, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return <select id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn(control, state(error), className)} {...p} />
}
