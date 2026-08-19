import { useLiveQuery } from 'dexie-react-hooks'
import { listProjects } from '../data/repository'
import type { Project } from '../data/types'

/** Live-updating list of every non-deleted project (active and archived alike). */
export function useProjects(): Project[] | undefined {
  return useLiveQuery(() => listProjects(), [])
}
