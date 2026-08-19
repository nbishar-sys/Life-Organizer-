import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  clearAllData,
  createEntry,
  createProject,
  createTag,
  ensureDefaultTags,
  getProject,
  listActiveEntries,
  listActiveTags,
  listProjects,
  restoreEntry,
  setProjectStatus,
  softDeleteEntry,
  softDeleteProject,
  softDeleteTag,
  toggleTaskComplete,
  updateEntry,
  updateProject,
} from './repository'
import { BUILTIN_TAG_FEEDBACK, BUILTIN_TAG_PERSONAL, BUILTIN_TAG_WORK } from './types'

const DEFAULT_TAG_IDS = [BUILTIN_TAG_PERSONAL, BUILTIN_TAG_WORK, BUILTIN_TAG_FEEDBACK].sort()

beforeEach(async () => {
  await db.entries.clear()
  await db.tags.clear()
  await db.projects.clear()
})

describe('createEntry', () => {
  it('trims content and fills in sync-ready defaults', async () => {
    const entry = await createEntry({ content: '  buy milk  ' })
    expect(entry.content).toBe('buy milk')
    expect(entry.type).toBe('note')
    expect(entry.completed).toBe(false)
    expect(entry.deletedAt).toBeNull()
    expect(entry.createdAt).toBe(entry.updatedAt)
    expect(entry.id).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it('persists so it comes back from listActiveEntries', async () => {
    const entry = await createEntry({ content: 'hello' })
    const all = await listActiveEntries()
    expect(all.map((e) => e.id)).toContain(entry.id)
  })
})

describe('updateEntry', () => {
  it('bumps updatedAt and leaves createdAt untouched', async () => {
    const entry = await createEntry({ content: 'draft' })
    await new Promise((resolve) => setTimeout(resolve, 2))
    await updateEntry(entry.id, { content: 'final' })
    const updated = await db.entries.get(entry.id)
    expect(updated?.content).toBe('final')
    expect(updated?.createdAt).toBe(entry.createdAt)
    expect(updated?.updatedAt).toBeGreaterThan(entry.updatedAt)
  })
})

describe('toggleTaskComplete', () => {
  it('flips completed and stamps/clears completedAt', async () => {
    const task = await createEntry({ content: 'ship it', type: 'task', dueDate: '2026-08-17' })

    await toggleTaskComplete(task.id)
    let stored = await db.entries.get(task.id)
    expect(stored?.completed).toBe(true)
    expect(stored?.completedAt).not.toBeNull()

    await toggleTaskComplete(task.id)
    stored = await db.entries.get(task.id)
    expect(stored?.completed).toBe(false)
    expect(stored?.completedAt).toBeNull()
  })
})

describe('soft delete / restore', () => {
  it('softDeleteEntry hides it from listActiveEntries; restoreEntry brings it back', async () => {
    const entry = await createEntry({ content: 'temp' })
    await softDeleteEntry(entry.id)
    expect((await listActiveEntries()).map((e) => e.id)).not.toContain(entry.id)

    await restoreEntry(entry.id)
    expect((await listActiveEntries()).map((e) => e.id)).toContain(entry.id)
  })
})

describe('ensureDefaultTags', () => {
  it('seeds the built-in tags exactly once each, safe to call repeatedly', async () => {
    await ensureDefaultTags()
    await ensureDefaultTags()
    const tags = await listActiveTags()
    expect(tags).toHaveLength(3)
    expect(tags.map((t) => t.id).sort()).toEqual(DEFAULT_TAG_IDS)
  })
})

describe('softDeleteTag', () => {
  it('strips the tag off every entry that carried it, leaving others untouched', async () => {
    const tag = await createTag('Errand', '#000000')
    const a = await createEntry({ content: 'a', tagIds: [tag.id] })
    const b = await createEntry({ content: 'b', tagIds: [tag.id, 'other'] })
    const c = await createEntry({ content: 'c', tagIds: ['other'] })

    await softDeleteTag(tag.id)

    expect((await db.entries.get(a.id))?.tagIds).toEqual([])
    expect((await db.entries.get(b.id))?.tagIds).toEqual(['other'])
    expect((await db.entries.get(c.id))?.tagIds).toEqual(['other'])
    expect((await listActiveTags()).map((t) => t.id)).not.toContain(tag.id)
  })
})

describe('createProject', () => {
  it('starts active with sync-ready defaults', async () => {
    const project = await createProject('  House renovation  ', '#4f46e5')
    expect(project.name).toBe('House renovation')
    expect(project.status).toBe('active')
    expect(project.deletedAt).toBeNull()
    expect(project.createdAt).toBe(project.updatedAt)
  })
})

describe('updateProject / setProjectStatus', () => {
  it('updateProject bumps updatedAt', async () => {
    const project = await createProject('Trip', '#0d9488')
    await new Promise((resolve) => setTimeout(resolve, 2))
    await updateProject(project.id, { name: 'Europe trip' })
    const updated = await getProject(project.id)
    expect(updated?.name).toBe('Europe trip')
    expect(updated?.updatedAt).toBeGreaterThan(project.updatedAt)
  })

  it('setProjectStatus archives and can unarchive', async () => {
    const project = await createProject('Trip', '#0d9488')
    await setProjectStatus(project.id, 'archived')
    expect((await getProject(project.id))?.status).toBe('archived')
    await setProjectStatus(project.id, 'active')
    expect((await getProject(project.id))?.status).toBe('active')
  })
})

describe('softDeleteProject', () => {
  it('unassigns the project from every entry that carried it, leaving the entries', async () => {
    const project = await createProject('House renovation', '#4f46e5')
    const other = await createProject('Other', '#000000')
    const a = await createEntry({ content: 'get quotes', projectId: project.id })
    const b = await createEntry({ content: 'unrelated', projectId: other.id })

    await softDeleteProject(project.id)

    expect((await db.entries.get(a.id))?.projectId).toBeNull()
    expect((await db.entries.get(b.id))?.projectId).toBe(other.id)
    expect((await listProjects()).map((p) => p.id)).not.toContain(project.id)
    // the entry itself survives — only the project link is removed
    expect((await db.entries.get(a.id))?.deletedAt).toBeNull()
  })
})

describe('clearAllData', () => {
  it('wipes entries, tags, and projects, then reseeds the default tags', async () => {
    await createEntry({ content: 'x' })
    await createTag('Custom', '#111111')
    await createProject('Some project', '#4f46e5')

    await clearAllData()

    expect(await listActiveEntries()).toEqual([])
    expect(await listProjects()).toEqual([])
    const tags = await listActiveTags()
    expect(tags.map((t) => t.id).sort()).toEqual(DEFAULT_TAG_IDS)
  })
})
