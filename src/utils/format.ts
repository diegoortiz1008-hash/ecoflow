const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const kw = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export const formatCop = (n: number) => cop.format(n)
export const formatKw = (n: number) => `${kw.format(n)} kW`
/** Las columnas `date` llegan como "YYYY-MM-DD" (string, no Date): se interpretan en UTC. */
export const formatFecha = (iso: string) => (iso ? fecha.format(new Date(`${iso}T00:00:00Z`)) : '—')
