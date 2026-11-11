import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  default: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600',
} as const
const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-11 px-6 text-base' } as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({ variant = 'default', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
