import { toDateStr, todayStr } from './dates'
import { isUntriaged, type Entry, type EntryType } from './types'

/**
 * Pure, dependency-free view logic over an already-loaded entry list.
 * Kept separate from repository.ts so "what counts as today's tasks" stays
 * easy to unit test without touching IndexedDB.
 */

/** Due today, or overdue and still open. Non-destructive: nothing is written
 * back to the entry, so an overdue task simply keeps showing up here — every
 * day — until it's completed or rescheduled. */
export function selectTodayTasks(entries: Entry[], today: string = todayStr()): Entry[] {
  return entries
    .filter(
      (e) =>
        e.type === 'task' &&
        !e.deletedAt &&
        !e.completed &&
        e.dueDate !== null &&
        e.dueDate <= today,
    )
    .sort((a, b) => {
      if (a.dueDate! !== b.dueDate!) return a.dueDate! < b.dueDate! ? -1 : 1
      return b.createdAt - a.createdAt
    })
}

export function selectTodayJournalEntries(entries: Entry[], today: string = todayStr()): Entry[] {
  return entries
    .filter((e) => e.type === 'journal' && !e.deletedAt && e.journalDate === today)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function selectCompletedToday(entries: Entry[], today: string = todayStr()): Entry[] {
  return entries
    .filter(
      (e) =>
        e.type === 'task' &&
        !e.deletedAt &&
        e.completed &&
        e.completedAt !== null &&
        toDateStr(new Date(e.completedAt)) === today,
    )
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
}

/** Quick captures nobody has triaged yet: no tag, no due date, no journal date. */
export function selectInboxEntries(entries: Entry[]): Entry[] {
  return entries.filter((e) => !e.deletedAt && isUntriaged(e)).sort((a, b) => b.createdAt - a.createdAt)
}

export interface NotebookFilter {
  query?: string
  type?: EntryType | 'all'
  tagId?: string | 'all'
  projectId?: string | 'all'
}

/** Pure reverse-chronological — pinned status is shown per-card (see EntryCard's
 * pin icon) rather than reordering the list, so day-grouping above this stays
 * sensible instead of a months-old pinned note jumping to the top. */
export function selectNotebookEntries(entries: Entry[], filter: NotebookFilter = {}): Entry[] {
  const q = filter.query?.trim().toLowerCase()
  return entries
    .filter((e) => !e.deletedAt)
    .filter((e) => (filter.type && filter.type !== 'all' ? e.type === filter.type : true))
    .filter((e) => (filter.tagId && filter.tagId !== 'all' ? e.tagIds.includes(filter.tagId) : true))
    .filter((e) =>
      filter.projectId && filter.projectId !== 'all' ? e.projectId === filter.projectId : true,
    )
    .filter((e) => (q ? e.content.toLowerCase().includes(q) : true))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** For a dedicated "Pinned" strip at the top of the Notebook. */
export function selectPinnedEntries(entries: Entry[]): Entry[] {
  return entries.filter((e) => !e.deletedAt && e.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Every non-deleted entry parked in a given project, newest first. */
export function selectProjectEntries(entries: Entry[], projectId: string): Entry[] {
  return entries
    .filter((e) => !e.deletedAt && e.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** How many open (non-deleted, non-completed) entries a project is currently holding. */
export function countOpenProjectEntries(entries: Entry[], projectId: string): number {
  return entries.filter((e) => !e.deletedAt && e.projectId === projectId && !e.completed).length
}
