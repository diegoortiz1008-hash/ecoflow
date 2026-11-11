import { createContext } from 'react'
import type { EcoFlowRepository } from '../services/repository'

export const RepositoryContext = createContext<EcoFlowRepository | null>(null)
