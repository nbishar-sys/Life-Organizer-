import { useLiveQuery } from 'dexie-react-hooks'
import { listActiveEntries } from '../data/repository'
import type { Entry } from '../data/types'

/**
 * Live-updating list of every non-deleted entry. Re-renders automatically
 * whenever any entry anywhere in the app is created, edited, or deleted —
 * no manual refetching needed. Returns `undefined` only very briefly while
 * the first IndexedDB read is in flight.
 */
export function useEntries(): Entry[] | undefined {
  return useLiveQuery(() => listActiveEntries(), [])
}
