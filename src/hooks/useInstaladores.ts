import { useCallback } from 'react'
import type { Instalador } from '../types/domain'
import { useAsyncList } from './useAsyncList'
import { useRepository } from './useRepository'

export function useInstaladores(sessionKey: string) {
  const repo = useRepository()
  const load = useCallback((): Promise<Instalador[]> => repo.listInstaladores(), [repo])
  const { data, ...rest } = useAsyncList(load, 'cargar los instaladores', sessionKey)
  return { instaladores: data, ...rest }
}
