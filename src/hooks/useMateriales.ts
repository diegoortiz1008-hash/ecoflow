import { useCallback } from 'react'
import type { Material } from '../types/domain'
import { useAsyncList } from './useAsyncList'
import { useRepository } from './useRepository'

export function useMateriales(sessionKey: string) {
  const repo = useRepository()
  const load = useCallback((): Promise<Material[]> => repo.listMateriales(), [repo])
  const { data, ...rest } = useAsyncList(load, 'cargar los materiales', sessionKey)
  return { materiales: data, ...rest }
}
