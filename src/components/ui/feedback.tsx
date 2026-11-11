import { Button } from './button'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p className="font-semibold text-rose-900">Algo salió mal</p>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      <Button variant="destructive" size="sm" className="mt-4" onClick={onRetry}>Reintentar</Button>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {children}
    </div>
  )
}
