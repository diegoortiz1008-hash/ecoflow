interface PgLikeError {
  code?: string
  message?: string
}

/** Traduce errores de PostgREST/Postgres (incluidas las reglas RN-x de los triggers) a texto para el usuario. */
export function toUserMessage(error: unknown, accion: string): string {
  const e = (typeof error === 'object' && error !== null ? error : {}) as PgLikeError
  const msg = e.message ?? ''
  if (/RN-\d|SEG-\d/.test(msg)) return msg.replace(/^.*?(RN-\d|SEG-\d)/, '$1')
  switch (e.code) {
    case '42501':
      return `No tienes permiso para ${accion}.`
    case '23514':
      return `No se pudo ${accion}: los datos no cumplen las reglas del proyecto.`
    case 'PGRST116':
      return `No se pudo ${accion}: el registro no existe o no tienes acceso.`
    default:
      return `No se pudo ${accion}.${msg ? ` (${msg})` : ''}`
  }
}
