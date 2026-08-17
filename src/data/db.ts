import Dexie, { type Table } from 'dexie'
import type { Entry, Tag } from './types'

/**
 * IndexedDB schema via Dexie. This is the only file that should import
 * Dexie directly — everything else goes through repository.ts.
 */
export class HubDatabase extends Dexie {
  entries!: Table<Entry, string>
  tags!: Table<Tag, string>

  constructor() {
    super('hub-db')
    this.version(1).stores({
      // Primary key first, then indexed fields. `*tagIds` is a multi-entry
      // index so `where('tagIds').equals(id)` can find an entry by any tag.
      entries: 'id, type, dueDate, journalDate, completed, deletedAt, createdAt, updatedAt, *tagIds',
      tags: 'id, name, deletedAt',
    })
  }
}

export const db = new HubDatabase()
