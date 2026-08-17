/**
 * Core data model.
 *
 * Everything is designed to be "sync-ready" even though v1 is local-only
 * (see repository.ts): every record carries a stable UUID plus
 * createdAt/updatedAt/deletedAt so a future sync layer can do last-write-wins
 * merging without changing this shape. Nothing in the UI should reach past
 * repository.ts into Dexie directly — that boundary is what lets storage
 * change later without touching every component.
 */

export type EntryType = 'task' | 'journal' | 'note'

export type CaptureSource = 'typed' | 'voice'

export interface Entry {
  id: string
  content: string
  type: EntryType

  /** Tag ids this entry carries. Empty until the user triages it. */
  tagIds: string[]

  /** Task fields */
  completed: boolean
  completedAt: number | null
  /** ISO date (YYYY-MM-DD), local calendar day the task is due. */
  dueDate: string | null

  /** Journal fields */
  /** ISO date (YYYY-MM-DD), local calendar day this reflection belongs to. */
  journalDate: string | null

  pinned: boolean
  source: CaptureSource

  createdAt: number
  updatedAt: number
  /** Soft delete — never hard-delete so a future sync merge can propagate it. */
  deletedAt: number | null
}

export interface Tag {
  id: string
  name: string
  /** Tailwind-ish hex color used for the tag chip. */
  color: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

/** The two tags every fresh install starts with, used to split work/life at a glance. */
export const BUILTIN_TAG_WORK = 'work'
export const BUILTIN_TAG_PERSONAL = 'personal'

export interface NewEntryInput {
  content: string
  type?: EntryType
  tagIds?: string[]
  dueDate?: string | null
  journalDate?: string | null
  pinned?: boolean
  source?: CaptureSource
}

/** An entry is "in the inbox" until it's given a tag, a due date, or a journal date. */
export function isUntriaged(entry: Entry): boolean {
  return entry.tagIds.length === 0 && !entry.dueDate && !entry.journalDate
}
