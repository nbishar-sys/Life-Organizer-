import { useLiveQuery } from 'dexie-react-hooks'
import { listActiveTags } from '../data/repository'
import type { Tag } from '../data/types'

export function useTags(): Tag[] | undefined {
  return useLiveQuery(() => listActiveTags(), [])
}
