import type { ReactNode } from 'react'
import type { EcoFlowRepository } from '../services/repository'
import { RepositoryContext } from './repositoryContext'

export function RepositoryProvider({ repository, children }: { repository: EcoFlowRepository; children: ReactNode }) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}
