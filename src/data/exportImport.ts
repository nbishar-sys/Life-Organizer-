import { db } from './db'
import type { Entry, Tag } from './types'

/**
 * JSON backup / restore. Doubles as the only "sync" that exists today:
 * export on one device, import on another. The shape here is deliberately
 * the same as the live record shape so a future real sync backend can reuse
 * it as its wire format.
 */

export interface ExportBundle {
  schemaVersion: 1
  exportedAt: number
  entries: Entry[]
  tags: Tag[]
}

export async function buildExportBundle(): Promise<ExportBundle> {
  const [entries, tags] = await Promise.all([db.entries.toArray(), db.tags.toArray()])
  return { schemaVersion: 1, exportedAt: Date.now(), entries, tags }
}

export function downloadExportBundle(bundle: ExportBundle): void {
  const json = JSON.stringify(bundle, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const dateStamp = new Date(bundle.exportedAt).toISOString().slice(0, 10)
  const link = document.createElement('a')
  link.href = url
  link.download = `hub-backup-${dateStamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function isExportBundle(value: unknown): value is ExportBundle {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.schemaVersion === 1 && Array.isArray(v.entries) && Array.isArray(v.tags)
}

export async function parseImportFile(file: File): Promise<ExportBundle> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  if (!isExportBundle(parsed)) {
    throw new Error("That doesn't look like a Hub backup file.")
  }
  return parsed
}

export interface ImportResult {
  importedEntries: number
  importedTags: number
  skipped: number
}

/**
 * Merge import: for each record, the newer `updatedAt` wins. Existing data
 * that isn't in the file is left untouched — this is a merge, not a replace.
 */
export async function importBundle(bundle: ExportBundle): Promise<ImportResult> {
  let importedEntries = 0
  let importedTags = 0
  let skipped = 0

  await db.transaction('rw', db.entries, db.tags, async () => {
    for (const tag of bundle.tags) {
      const existing = await db.tags.get(tag.id)
      if (!existing || existing.updatedAt < tag.updatedAt) {
        await db.tags.put(tag)
        importedTags++
      } else {
        skipped++
      }
    }
    for (const entry of bundle.entries) {
      const existing = await db.entries.get(entry.id)
      if (!existing || existing.updatedAt < entry.updatedAt) {
        await db.entries.put(entry)
        importedEntries++
      } else {
        skipped++
      }
    }
  })

  return { importedEntries, importedTags, skipped }
}
