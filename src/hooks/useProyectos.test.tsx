// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { RepositoryProvider } from '../context/RepositoryProvider'
import { createDemoRepository, DEMO_USUARIOS } from '../services/demoRepository'
import type { Sesion } from '../types/domain'
import { useProyectos } from './useProyectos'

const [COORD, ANA] = DEMO_USUARIOS

function setup(inicial: Sesion, latency = 0) {
  const sesion = { actual: inicial }
  const repo = createDemoRepository({ latency, getSesion: () => sesion.actual })
  const wrapper = ({ children }: { children: ReactNode }) => <RepositoryProvider repository={repo}>{children}</RepositoryProvider>
  return { repo, sesion, wrapper }
}

const nuevo = {
  nombre: 'Hospital del Sur', cliente: 'Red Salud', ciudad: 'Cali', direccion: null,
  capacidadKw: 300, fechaInicio: '2027-01-10', fechaFinEstimada: '2027-03-01', instaladorId: 'i-bruno',
}

describe('useProyectos', () => {
  it('coordinador: carga los 4 proyectos y calcula KPIs', async () => {
    const { wrapper } = setup(COORD)
    const { result } = renderHook(() => useProyectos(COORD.userId), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.kpis).toMatchObject({ total: 4, pendiente: 2, en_progreso: 1, completado: 1, kwTotales: 1225.5 })
    expect(result.current.porEstado.pendiente.map((p) => p.nombre)).toContain('Clínica Costa Azul')
  })

  it('instaladora (RLS SEG-2): solo recibe sus proyectos asignados', async () => {
    const { wrapper } = setup(ANA)
    const { result } = renderHook(() => useProyectos(ANA.userId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.proyectos).toHaveLength(2)
    expect(result.current.proyectos.every((p) => p.instaladorNombre === 'Ana Ríos')).toBe(true)
  })

  it('filtra por texto y ciudad sin volver a consultar', async () => {
    const { wrapper } = setup(COORD)
    const { result, rerender } = renderHook(({ f }) => useProyectos(COORD.userId, f), {
      wrapper,
      initialProps: { f: { texto: '', ciudad: '' } },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    rerender({ f: { texto: 'colegio', ciudad: '' } })
    expect(Object.values(result.current.porEstado).flat().map((p) => p.nombre)).toEqual(['Colegio San Martín'])
    rerender({ f: { texto: '', ciudad: 'Bogotá' } })
    expect(Object.values(result.current.porEstado).flat()).toHaveLength(1)
  })

  it('coordinador crea un proyecto y aparece como pendiente', async () => {
    const { wrapper } = setup(COORD)
    const { result } = renderHook(() => useProyectos(COORD.userId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res: Awaited<ReturnType<typeof result.current.crearProyecto>> | undefined
    await act(async () => {
      res = await result.current.crearProyecto(nuevo)
    })
    expect(res).toEqual({ ok: true })
    expect(result.current.porEstado.pendiente.map((p) => p.nombre)).toContain('Hospital del Sur')
    expect(result.current.kpis.total).toBe(5)
  })

  it('instaladora no puede crear proyectos (error de permisos traducido)', async () => {
    const { wrapper } = setup(ANA)
    const { result } = renderHook(() => useProyectos(ANA.userId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res: Awaited<ReturnType<typeof result.current.crearProyecto>> | undefined
    await act(async () => {
      res = await result.current.crearProyecto(nuevo)
    })
    expect(res).toEqual({ ok: false, error: 'No tienes permiso para crear el proyecto.' })
  })

  it('cambio de estado optimista: se ve al instante y se confirma', async () => {
    const { wrapper } = setup(ANA, 20)
    const { result } = renderHook(() => useProyectos(ANA.userId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let p!: Promise<boolean>
    act(() => {
      p = result.current.cambiarEstado('p-1', 'completado')
    })
    expect(result.current.proyectos.find((x) => x.id === 'p-1')?.estado).toBe('completado')
    expect(result.current.pendientes['p-1']).toBe(true)
    await act(async () => {
      expect(await p).toBe(true)
    })
    expect(result.current.pendientes['p-1']).toBeUndefined()
  })

  it('RN-4: si la BD rechaza la transición, hace rollback y muestra el motivo', async () => {
    const { wrapper } = setup(ANA)
    const { result } = renderHook(() => useProyectos(ANA.userId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.cambiarEstado('p-1', 'pendiente') // retroceder: prohibido para instaladores
    })
    expect(result.current.proyectos.find((x) => x.id === 'p-1')?.estado).toBe('en_progreso')
    expect(result.current.mutationError).toMatch(/^RN-4/)
  })

  it('RN-3: el coordinador no puede iniciar un proyecto sin instalador', async () => {
    const { wrapper } = setup(COORD)
    const { result } = renderHook(() => useProyectos(COORD.userId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.cambiarEstado('p-4', 'en_progreso')
    })
    expect(result.current.proyectos.find((x) => x.id === 'p-4')?.estado).toBe('pendiente')
    expect(result.current.mutationError).toMatch(/^RN-3/)
  })

  it('error de carga y reintento', async () => {
    const { repo, wrapper } = setup(COORD)
    repo.failNext('08006', 'connection failure')
    const { result } = renderHook(() => useProyectos(COORD.userId), { wrapper })
    await waitFor(() => expect(result.current.error).toMatch(/No se pudo cargar los proyectos/))
    act(() => result.current.reintentar())
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.proyectos).toHaveLength(4))
  })

  it('al cambiar de usuario recarga con los permisos del nuevo usuario', async () => {
    const { sesion, wrapper } = setup(COORD)
    const { result, rerender } = renderHook(({ key }) => useProyectos(key), { wrapper, initialProps: { key: COORD.userId } })
    await waitFor(() => expect(result.current.proyectos).toHaveLength(4))
    sesion.actual = ANA
    rerender({ key: ANA.userId })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.proyectos).toEqual([]) // nunca muestra datos del usuario anterior
    await waitFor(() => expect(result.current.proyectos).toHaveLength(2))
  })
})
