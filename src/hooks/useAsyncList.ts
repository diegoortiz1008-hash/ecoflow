import { useCallback, useEffect, useState } from 'react'
import { toUserMessage } from '../lib/errors'

interface State<T> {
  key: string
  data: T[]
  error: string | null
  loaded: boolean
}

/**
 * Carga una lista asíncrona con estados de carga/error y `reload()`.
 * `deps` controla cuándo recargar (p. ej. al cambiar de usuario).
 */
export function useAsyncList<T>(load: () => Promise<T[]>, accion: string, reloadKey: unknown) {
  const [token, setToken] = useState(0)
  const [state, setState] = useState<State<T>>({ key: "", data: [], error: null, loaded: false })
  const key = `${token}|${String(reloadKey)}`

  useEffect(() => {
    let active = true
    load()
      .then((data) => active && setState({ key, data, error: null, loaded: true }))
      .catch((e: unknown) => active && setState({ key, data: [], error: toUserMessage(e, accion), loaded: true }))
    return () => {
      active = false
    }
  }, [load, accion, key])

  const reload = useCallback(() => setToken((t) => t + 1), [])
  const isCurrent = state.key === key && state.loaded
  return { data: state.data, error: isCurrent ? state.error : null, isLoading: !isCurrent, reload }
}
