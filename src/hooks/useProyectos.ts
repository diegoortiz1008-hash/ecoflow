import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { toUserMessage } from '../lib/errors'
import { ESTADOS, type NuevoProyecto, type ProyectoEstado, type ProyectoResumen } from '../types/domain'
import { useRepository } from './useRepository'

// ---------------- Estado (reducer puro) ----------------
interface ProyectosState {
  loadKey: string | null
  proyectos: ProyectoResumen[]
  error: string | null
  mutationError: string | null
  pendientes: Record<string, true>
}

type Action =
  | { type: 'CARGA_OK'; loadKey: string; proyectos: ProyectoResumen[] }
  | { type: 'CARGA_ERROR'; loadKey: string; error: string }
  | { type: 'REINTENTAR' }
  | { type: 'CREADO'; proyecto: ProyectoResumen }
  | { type: 'ESTADO_OPTIMISTA'; id: string; estado: ProyectoEstado }
  | { type: 'ESTADO_OK'; proyecto: ProyectoResumen }
  | { type: 'ESTADO_ROLLBACK'; previo: ProyectoResumen; error: string }
  | { type: 'LIMPIAR_ERROR' }

const inicial: ProyectosState = { loadKey: null, proyectos: [], error: null, mutationError: null, pendientes: {} }

const sinPendiente = (p: Record<string, true>, id: string) => {
  const next = { ...p }
  delete next[id]
  return next
}

export function proyectosReducer(s: ProyectosState, a: Action): ProyectosState {
  switch (a.type) {
    case 'CARGA_OK':
      return { ...inicial, loadKey: a.loadKey, proyectos: a.proyectos }
    case 'CARGA_ERROR':
      return { ...inicial, loadKey: a.loadKey, error: a.error }
    case 'REINTENTAR':
      return { ...s, loadKey: null, error: null }
    case 'CREADO':
      return { ...s, proyectos: [a.proyecto, ...s.proyectos.filter((p) => p.id !== a.proyecto.id)], mutationError: null }
    case 'ESTADO_OPTIMISTA':
      return {
        ...s,
        proyectos: s.proyectos.map((p) => (p.id === a.id ? { ...p, estado: a.estado } : p)),
        pendientes: { ...s.pendientes, [a.id]: true },
        mutationError: null,
      }
    case 'ESTADO_OK':
      return { ...s, proyectos: s.proyectos.map((p) => (p.id === a.proyecto.id ? a.proyecto : p)), pendientes: sinPendiente(s.pendientes, a.proyecto.id) }
    case 'ESTADO_ROLLBACK':
      return {
        ...s,
        proyectos: s.proyectos.map((p) => (p.id === a.previo.id ? a.previo : p)),
        pendientes: sinPendiente(s.pendientes, a.previo.id),
        mutationError: a.error,
      }
    case 'LIMPIAR_ERROR':
      return { ...s, mutationError: null }
  }
}

// ---------------- Hook ----------------
export interface FiltrosProyectos {
  texto: string
  ciudad: string
}

/**
 * Proyectos visibles para la sesión actual (RLS decide cuáles), con KPIs derivados,
 * creación y cambio de estado optimista con rollback.
 * @param sessionKey identifica al usuario: al cambiar, se recarga (otros permisos, otros datos).
 */
export function useProyectos(sessionKey: string, filtros: FiltrosProyectos = { texto: '', ciudad: '' }) {
  const repo = useRepository()
  const [state, dispatch] = useReducer(proyectosReducer, inicial)
  const [token, setToken] = useState(0)
  const loadKey = `${sessionKey}#${token}`
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    let active = true
    repo
      .listProyectos()
      .then((proyectos) => active && dispatch({ type: 'CARGA_OK', loadKey, proyectos }))
      .catch((e: unknown) => active && dispatch({ type: 'CARGA_ERROR', loadKey, error: toUserMessage(e, 'cargar los proyectos') }))
    return () => {
      active = false
    }
  }, [repo, loadKey])

  const reintentar = useCallback(() => {
    dispatch({ type: 'REINTENTAR' })
    setToken((t) => t + 1)
  }, [])

  const crearProyecto = useCallback(
    async (input: NuevoProyecto): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        const proyecto = await repo.crearProyecto(input)
        dispatch({ type: 'CREADO', proyecto })
        return { ok: true }
      } catch (e) {
        return { ok: false, error: toUserMessage(e, 'crear el proyecto') }
      }
    },
    [repo],
  )

  const cambiarEstado = useCallback(
    async (id: string, estado: ProyectoEstado) => {
      const previo = stateRef.current.proyectos.find((p) => p.id === id)
      if (!previo || previo.estado === estado) return false
      dispatch({ type: 'ESTADO_OPTIMISTA', id, estado })
      try {
        dispatch({ type: 'ESTADO_OK', proyecto: await repo.cambiarEstado(id, estado) })
        return true
      } catch (e) {
        dispatch({ type: 'ESTADO_ROLLBACK', previo, error: toUserMessage(e, 'cambiar el estado') })
        return false
      }
    },
    [repo],
  )

  const limpiarError = useCallback(() => dispatch({ type: 'LIMPIAR_ERROR' }), [])

  const isCurrent = state.loadKey === loadKey
  const proyectos = useMemo(() => (isCurrent ? state.proyectos : []), [isCurrent, state.proyectos])

  const filtrados = useMemo(() => {
    const q = filtros.texto.trim().toLowerCase()
    return proyectos.filter(
      (p) =>
        (!filtros.ciudad || p.ciudad === filtros.ciudad) &&
        (!q || p.nombre.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q)),
    )
  }, [proyectos, filtros.texto, filtros.ciudad])

  const porEstado = useMemo(() => {
    const g = Object.fromEntries(ESTADOS.map((e) => [e, [] as ProyectoResumen[]])) as Record<ProyectoEstado, ProyectoResumen[]>
    for (const p of filtrados) g[p.estado].push(p)
    return g
  }, [filtrados])

  const kpis = useMemo(
    () => ({
      total: proyectos.length,
      pendiente: proyectos.filter((p) => p.estado === 'pendiente').length,
      en_progreso: proyectos.filter((p) => p.estado === 'en_progreso').length,
      completado: proyectos.filter((p) => p.estado === 'completado').length,
      kwTotales: proyectos.reduce((a, p) => a + p.capacidadKw, 0),
      costoMateriales: proyectos.reduce((a, p) => a + p.costoMateriales, 0),
    }),
    [proyectos],
  )

  const ciudades = useMemo(() => [...new Set(proyectos.map((p) => p.ciudad))].sort(), [proyectos])

  return {
    proyectos,
    porEstado,
    kpis,
    ciudades,
    isLoading: !isCurrent,
    error: isCurrent ? state.error : null,
    mutationError: state.mutationError,
    pendientes: state.pendientes,
    crearProyecto,
    cambiarEstado,
    reintentar,
    limpiarError,
  }
}
