import { useContext } from 'react'
import { RepositoryContext } from '../context/repositoryContext'

export function useRepository() {
  const repo = useContext(RepositoryContext)
  if (!repo) throw new Error('useRepository debe usarse dentro de <RepositoryProvider>')
  return repo
}
