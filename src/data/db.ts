import Dexie, { type Table } from 'dexie'
import type { Entry, Project, Tag } from './types'

/**
 * IndexedDB schema via Dexie. This is the only file that should import
 * Dexie directly — everything else goes through repository.ts.
 */
export class HubDatabase extends Dexie {
  entries!: Table<Entry, string>
  tags!: Table<Tag, string>
  projects!: Table<Project, string>

  constructor() {
    super('hub-db')

    this.version(1).stores({
      // Primary key first, then indexed fields. `*tagIds` is a multi-entry
      // index so `where('tagIds').equals(id)` can find an entry by any tag.
      entries: 'id, type, dueDate, journalDate, completed, deletedAt, createdAt, updatedAt, *tagIds',
      tags: 'id, name, deletedAt',
    })

    // v2: adds Projects (long-term "container" for related entries) and a
    // projectId index on entries. Existing entries predate the field, so
    // the upgrade backfills projectId: null rather than leaving it
    // `undefined` — keeps every record matching the Entry type exactly.
    this.version(2)
      .stores({
        entries:
          'id, type, dueDate, journalDate, completed, deletedAt, createdAt, updatedAt, projectId, *tagIds',
        tags: 'id, name, deletedAt',
        projects: 'id, name, status, deletedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('entries')
          .toCollection()
          .modify((entry: Entry) => {
            if (entry.projectId === undefined) entry.projectId = null
          })
      })
  }
}

export const db = new HubDatabase()
