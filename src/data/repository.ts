import { db } from './db'
import { newId } from './id'
import {
  BUILTIN_TAG_PERSONAL,
  BUILTIN_TAG_WORK,
  type Entry,
  type NewEntryInput,
  type Project,
  type ProjectStatus,
  type Tag,
} from './types'

/**
 * Every storage read/write in the app goes through this module — components
 * never import `db` directly. That boundary is deliberate: it's what will
 * let a future sync layer (push/pull against a real backend) slot in later
 * by changing this one file, without touching any UI code.
 */

const now = () => Date.now()

// ---------- Entries ----------

export async function createEntry(input: NewEntryInput): Promise<Entry> {
  const timestamp = now()
  const entry: Entry = {
    id: newId(),
    content: input.content.trim(),
    type: input.type ?? 'note',
    tagIds: input.tagIds ?? [],
    projectId: input.projectId ?? null,
    completed: false,
    completedAt: null,
    dueDate: input.dueDate ?? null,
    journalDate: input.journalDate ?? null,
    pinned: input.pinned ?? false,
    source: input.source ?? 'typed',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  }
  await db.entries.add(entry)
  return entry
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<Entry, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.entries.update(id, { ...patch, updatedAt: now() })
}

export async function toggleTaskComplete(id: string): Promise<void> {
  const entry = await db.entries.get(id)
  if (!entry) return
  const completed = !entry.completed
  await db.entries.update(id, {
    completed,
    completedAt: completed ? now() : null,
    updatedAt: now(),
  })
}

export async function softDeleteEntry(id: string): Promise<void> {
  await db.entries.update(id, { deletedAt: now(), updatedAt: now() })
}

export async function restoreEntry(id: string): Promise<void> {
  await db.entries.update(id, { deletedAt: null, updatedAt: now() })
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  return db.entries.get(id)
}

/** All non-deleted entries. Personal-scale data, so a client-side scan here is fine. */
export async function listActiveEntries(): Promise<Entry[]> {
  return db.entries.filter((e) => e.deletedAt === null).toArray()
}

// ---------- Tags ----------

export async function createTag(name: string, color: string): Promise<Tag> {
  const timestamp = now()
  const tag: Tag = {
    id: newId(),
    name: name.trim(),
    color,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  }
  await db.tags.add(tag)
  return tag
}

export async function updateTag(
  id: string,
  patch: Partial<Pick<Tag, 'name' | 'color'>>,
): Promise<void> {
  await db.tags.update(id, { ...patch, updatedAt: now() })
}

export async function softDeleteTag(id: string): Promise<void> {
  await db.tags.update(id, { deletedAt: now(), updatedAt: now() })
  // Strip this tag off every entry that carries it so nothing silently
  // references a hidden tag id.
  const carriers = await db.entries.where('tagIds').equals(id).toArray()
  await Promise.all(
    carriers.map((e) =>
      db.entries.update(e.id, {
        tagIds: e.tagIds.filter((t) => t !== id),
        updatedAt: now(),
      }),
    ),
  )
}

export async function listActiveTags(): Promise<Tag[]> {
  return db.tags.filter((t) => t.deletedAt === null).toArray()
}

const DEFAULT_TAGS: Array<{ id: string; name: string; color: string }> = [
  { id: BUILTIN_TAG_WORK, name: 'Work', color: '#4f46e5' },
  { id: BUILTIN_TAG_PERSONAL, name: 'Personal', color: '#0d9488' },
]

/** Seeds the two built-in tags exactly once. Cheap to call on every app start. */
export async function ensureDefaultTags(): Promise<void> {
  await db.transaction('rw', db.tags, async () => {
    for (const tag of DEFAULT_TAGS) {
      const existing = await db.tags.get(tag.id)
      if (!existing) {
        const timestamp = now()
        await db.tags.add({ ...tag, createdAt: timestamp, updatedAt: timestamp, deletedAt: null })
      }
    }
  })
}

// ---------- Projects ----------

export async function createProject(name: string, color: string): Promise<Project> {
  const timestamp = now()
  const project: Project = {
    id: newId(),
    name: name.trim(),
    color,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  }
  await db.projects.add(project)
  return project
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, 'name' | 'color' | 'status'>>,
): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: now() })
}

export async function setProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  await updateProject(id, { status })
}

export async function softDeleteProject(id: string): Promise<void> {
  await db.projects.update(id, { deletedAt: now(), updatedAt: now() })
  // Unassign this project from every entry that carried it, same cascade
  // pattern as softDeleteTag — entries themselves are kept.
  const carriers = await db.entries.where('projectId').equals(id).toArray()
  await Promise.all(
    carriers.map((e) => db.entries.update(e.id, { projectId: null, updatedAt: now() })),
  )
}

/** Every non-deleted project, active and archived alike — callers group by `status`. */
export async function listProjects(): Promise<Project[]> {
  return db.projects.filter((p) => p.deletedAt === null).toArray()
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

// ---------- Danger zone ----------

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.entries, db.tags, db.projects, async () => {
    await db.entries.clear()
    await db.tags.clear()
    await db.projects.clear()
  })
  await ensureDefaultTags()
}
