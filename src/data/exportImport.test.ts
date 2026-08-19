import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { buildExportBundle, importBundle, parseImportFile, type ExportBundle } from './exportImport'
import { createEntry, createProject, createTag, listActiveEntries, listProjects } from './repository'

beforeEach(async () => {
  await db.entries.clear()
  await db.tags.clear()
  await db.projects.clear()
})

describe('buildExportBundle', () => {
  it('captures every current entry, tag, and project', async () => {
    const entry = await createEntry({ content: 'keep me' })
    const tag = await createTag('Errand', '#123456')
    const project = await createProject('House renovation', '#4f46e5')
    const bundle = await buildExportBundle()
    expect(bundle.schemaVersion).toBe(1)
    expect(bundle.entries.map((e) => e.id)).toContain(entry.id)
    expect(bundle.tags.map((t) => t.id)).toContain(tag.id)
    expect(bundle.projects?.map((p) => p.id)).toContain(project.id)
  })
})

describe('importBundle', () => {
  it('adds records that do not exist locally yet', async () => {
    const bundle: ExportBundle = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      entries: [
        {
          id: 'remote-1',
          content: 'from another device',
          type: 'note',
          tagIds: [],
          projectId: null,
          completed: false,
          completedAt: null,
          dueDate: null,
          journalDate: null,
          pinned: false,
          source: 'typed',
          createdAt: 1000,
          updatedAt: 1000,
          deletedAt: null,
        },
      ],
      tags: [],
    }
    const result = await importBundle(bundle)
    expect(result.importedEntries).toBe(1)
    expect((await listActiveEntries()).map((e) => e.id)).toContain('remote-1')
  })

  it('imports projects with the same last-write-wins merge as entries/tags', async () => {
    const bundle: ExportBundle = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      entries: [],
      tags: [],
      projects: [
        {
          id: 'remote-project',
          name: 'From another device',
          color: '#4f46e5',
          status: 'active',
          createdAt: 1000,
          updatedAt: 1000,
          deletedAt: null,
        },
      ],
    }
    const result = await importBundle(bundle)
    expect(result.importedProjects).toBe(1)
    expect((await listProjects()).map((p) => p.id)).toContain('remote-project')
  })

  it('treats a bundle with no `projects` field (pre-Projects backup) as having none, without failing', async () => {
    const bundle: ExportBundle = { schemaVersion: 1, exportedAt: Date.now(), entries: [], tags: [] }
    const result = await importBundle(bundle)
    expect(result.importedProjects).toBe(0)
  })

  it('last-write-wins: a newer local edit is not clobbered by a stale import', async () => {
    const local = await createEntry({ content: 'original' })
    const newerUpdatedAt = local.updatedAt + 10_000
    await db.entries.update(local.id, { content: 'edited locally', updatedAt: newerUpdatedAt })

    const staleBundle: ExportBundle = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      entries: [{ ...local, content: 'stale from backup' }], // still carries the old updatedAt
      tags: [],
    }
    const result = await importBundle(staleBundle)

    expect(result.skipped).toBe(1)
    expect(result.importedEntries).toBe(0)
    const stored = await db.entries.get(local.id)
    expect(stored?.content).toBe('edited locally')
  })

  it('an older local record is overwritten by a newer imported one', async () => {
    const local = await createEntry({ content: 'old' })
    const newerBundle: ExportBundle = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      entries: [{ ...local, content: 'newer from backup', updatedAt: local.updatedAt + 10_000 }],
      tags: [],
    }
    const result = await importBundle(newerBundle)

    expect(result.importedEntries).toBe(1)
    const stored = await db.entries.get(local.id)
    expect(stored?.content).toBe('newer from backup')
  })
})

describe('parseImportFile', () => {
  it('rejects a file that is not valid JSON', async () => {
    const file = new File(['not json'], 'backup.json', { type: 'application/json' })
    await expect(parseImportFile(file)).rejects.toThrow(/valid JSON/)
  })

  it('rejects valid JSON that is not a Hub backup', async () => {
    const file = new File([JSON.stringify({ hello: 'world' })], 'backup.json', {
      type: 'application/json',
    })
    await expect(parseImportFile(file)).rejects.toThrow(/Hub backup/)
  })

  it('accepts a well-formed bundle', async () => {
    const bundle: ExportBundle = { schemaVersion: 1, exportedAt: Date.now(), entries: [], tags: [] }
    const file = new File([JSON.stringify(bundle)], 'backup.json', { type: 'application/json' })
    await expect(parseImportFile(file)).resolves.toEqual(bundle)
  })
})
