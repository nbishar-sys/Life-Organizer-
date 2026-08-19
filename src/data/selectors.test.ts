import { describe, expect, it } from 'vitest'
import {
  countOpenProjectEntries,
  selectCompletedToday,
  selectInboxEntries,
  selectNotebookEntries,
  selectPinnedEntries,
  selectProjectEntries,
  selectTodayJournalEntries,
  selectTodayTasks,
} from './selectors'
import { isUntriaged, type Entry } from './types'

let counter = 0
function makeEntry(overrides: Partial<Entry> = {}): Entry {
  counter += 1
  const now = Date.now() + counter
  return {
    id: `entry-${counter}`,
    content: `entry ${counter}`,
    type: 'note',
    tagIds: [],
    projectId: null,
    completed: false,
    completedAt: null,
    dueDate: null,
    journalDate: null,
    pinned: false,
    source: 'typed',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  }
}

describe('selectTodayTasks', () => {
  const today = '2026-08-17'

  it('includes tasks due today and overdue open tasks, oldest-due first', () => {
    const dueToday = makeEntry({ type: 'task', dueDate: today })
    const overdue = makeEntry({ type: 'task', dueDate: '2026-08-10' })
    const future = makeEntry({ type: 'task', dueDate: '2026-08-20' })
    const result = selectTodayTasks([dueToday, overdue, future], today)
    expect(result.map((e) => e.id)).toEqual([overdue.id, dueToday.id])
  })

  it('excludes completed tasks and non-task entries', () => {
    const completed = makeEntry({ type: 'task', dueDate: today, completed: true })
    const note = makeEntry({ type: 'note', dueDate: today })
    expect(selectTodayTasks([completed, note], today)).toEqual([])
  })

  it('never mutates dueDate — an overdue task just keeps showing up here', () => {
    const overdue = makeEntry({ type: 'task', dueDate: '2026-08-01' })
    selectTodayTasks([overdue], today)
    expect(overdue.dueDate).toBe('2026-08-01')
  })

  it('excludes soft-deleted tasks', () => {
    const deleted = makeEntry({ type: 'task', dueDate: today, deletedAt: Date.now() })
    expect(selectTodayTasks([deleted], today)).toEqual([])
  })
})

describe('selectTodayJournalEntries', () => {
  it('only returns journal entries dated exactly today', () => {
    const today = '2026-08-17'
    const todayEntry = makeEntry({ type: 'journal', journalDate: today })
    const yesterdayEntry = makeEntry({ type: 'journal', journalDate: '2026-08-16' })
    const result = selectTodayJournalEntries([todayEntry, yesterdayEntry], today)
    expect(result.map((e) => e.id)).toEqual([todayEntry.id])
  })
})

describe('selectCompletedToday', () => {
  it('matches on completedAt, not createdAt', () => {
    const today = '2026-08-17'
    const completedToday = makeEntry({
      type: 'task',
      completed: true,
      completedAt: new Date(2026, 7, 17, 9).getTime(),
      createdAt: new Date(2026, 7, 1).getTime(),
    })
    const completedYesterday = makeEntry({
      type: 'task',
      completed: true,
      completedAt: new Date(2026, 7, 16).getTime(),
    })
    const result = selectCompletedToday([completedToday, completedYesterday], today)
    expect(result.map((e) => e.id)).toEqual([completedToday.id])
  })
})

describe('isUntriaged / selectInboxEntries', () => {
  it('a bare capture with no tag/date is untriaged', () => {
    expect(isUntriaged(makeEntry())).toBe(true)
  })

  it('a tag, due date, journal date, or project each triage it out of the inbox', () => {
    expect(isUntriaged(makeEntry({ tagIds: ['work'] }))).toBe(false)
    expect(isUntriaged(makeEntry({ dueDate: '2026-08-17' }))).toBe(false)
    expect(isUntriaged(makeEntry({ journalDate: '2026-08-17' }))).toBe(false)
    expect(isUntriaged(makeEntry({ projectId: 'house-reno' }))).toBe(false)
  })

  it('selectInboxEntries keeps only untriaged, non-deleted entries', () => {
    const untriaged = makeEntry()
    const tagged = makeEntry({ tagIds: ['work'] })
    const deleted = makeEntry({ deletedAt: Date.now() })
    const result = selectInboxEntries([untriaged, tagged, deleted])
    expect(result.map((e) => e.id)).toEqual([untriaged.id])
  })
})

describe('selectNotebookEntries', () => {
  it('filters by type, tag, and search text together', () => {
    const match = makeEntry({ type: 'note', tagIds: ['work'], content: 'renew the domain' })
    const wrongType = makeEntry({ type: 'task', tagIds: ['work'], content: 'renew the domain' })
    const wrongTag = makeEntry({ type: 'note', tagIds: ['personal'], content: 'renew the domain' })
    const wrongText = makeEntry({ type: 'note', tagIds: ['work'], content: 'buy milk' })
    const result = selectNotebookEntries([match, wrongType, wrongTag, wrongText], {
      type: 'note',
      tagId: 'work',
      query: 'domain',
    })
    expect(result.map((e) => e.id)).toEqual([match.id])
  })

  it('search is case-insensitive', () => {
    const entry = makeEntry({ content: 'Renew The Domain' })
    expect(selectNotebookEntries([entry], { query: 'domain' })).toHaveLength(1)
  })

  it('filters by project', () => {
    const inProject = makeEntry({ projectId: 'house-reno' })
    const notInProject = makeEntry({ projectId: null })
    const otherProject = makeEntry({ projectId: 'other' })
    const result = selectNotebookEntries([inProject, notInProject, otherProject], {
      projectId: 'house-reno',
    })
    expect(result.map((e) => e.id)).toEqual([inProject.id])
  })

  it('sorts newest first and does not reorder by pinned status', () => {
    const older = makeEntry({ createdAt: 1000, pinned: true })
    const newer = makeEntry({ createdAt: 2000, pinned: false })
    const result = selectNotebookEntries([older, newer])
    expect(result.map((e) => e.id)).toEqual([newer.id, older.id])
  })
})

describe('selectPinnedEntries', () => {
  it('returns only pinned, non-deleted entries, most-recently-updated first', () => {
    const pinnedOld = makeEntry({ pinned: true, updatedAt: 1000 })
    const pinnedNew = makeEntry({ pinned: true, updatedAt: 2000 })
    const unpinned = makeEntry({ pinned: false, updatedAt: 3000 })
    const result = selectPinnedEntries([pinnedOld, pinnedNew, unpinned])
    expect(result.map((e) => e.id)).toEqual([pinnedNew.id, pinnedOld.id])
  })
})

describe('selectProjectEntries', () => {
  it('returns only non-deleted entries in the given project, newest first', () => {
    const older = makeEntry({ projectId: 'house-reno', createdAt: 1000 })
    const newer = makeEntry({ projectId: 'house-reno', createdAt: 2000 })
    const otherProject = makeEntry({ projectId: 'other' })
    const noProject = makeEntry({ projectId: null })
    const deleted = makeEntry({ projectId: 'house-reno', deletedAt: Date.now() })
    const result = selectProjectEntries(
      [older, newer, otherProject, noProject, deleted],
      'house-reno',
    )
    expect(result.map((e) => e.id)).toEqual([newer.id, older.id])
  })

  it('a dated task inside a project is still just a normal entry here — Today decides visibility separately', () => {
    const task = makeEntry({ projectId: 'house-reno', type: 'task', dueDate: '2026-08-17' })
    expect(selectProjectEntries([task], 'house-reno').map((e) => e.id)).toEqual([task.id])
  })
})

describe('countOpenProjectEntries', () => {
  it('counts non-deleted, non-completed entries in the project', () => {
    const open = makeEntry({ projectId: 'house-reno', completed: false })
    const done = makeEntry({ projectId: 'house-reno', type: 'task', completed: true })
    const deleted = makeEntry({ projectId: 'house-reno', deletedAt: Date.now() })
    const otherProject = makeEntry({ projectId: 'other' })
    expect(countOpenProjectEntries([open, done, deleted, otherProject], 'house-reno')).toBe(1)
  })
})
