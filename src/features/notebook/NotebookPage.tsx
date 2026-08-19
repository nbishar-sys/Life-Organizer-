import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'
import { useEntries } from '../../hooks/useEntries'
import { useTags } from '../../hooks/useTags'
import { useProjects } from '../../hooks/useProjects'
import { selectNotebookEntries, selectPinnedEntries, type NotebookFilter } from '../../data/selectors'
import { formatDayHeading, toDateStr } from '../../data/dates'
import { EntryCard } from '../entries/EntryCard'
import { EntryDetailSheet } from '../entries/EntryDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Entry, EntryType } from '../../data/types'

const TYPE_FILTERS: Array<{ value: EntryType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'task', label: 'Tasks' },
  { value: 'journal', label: 'Journal' },
]

export function NotebookPage() {
  const entries = useEntries()
  const tags = useTags() ?? []
  const projects = useProjects() ?? []
  const [query, setQuery] = useState('')
  const [type, setType] = useState<EntryType | 'all'>('all')
  const [tagId, setTagId] = useState<string>('all')
  const [projectId, setProjectId] = useState<string>('all')
  const [openEntry, setOpenEntry] = useState<Entry | null>(null)

  const isFiltering =
    query.trim().length > 0 || type !== 'all' || tagId !== 'all' || projectId !== 'all'

  const filtered = useMemo(() => {
    const filter: NotebookFilter = { query, type, tagId, projectId }
    return entries ? selectNotebookEntries(entries, filter) : []
  }, [entries, query, type, tagId, projectId])

  const pinned = useMemo(() => (entries ? selectPinnedEntries(entries) : []), [entries])

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of filtered) {
      const key = toDateStr(new Date(entry.createdAt))
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return Array.from(map.entries())
  }, [filtered])

  if (!entries) return null

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notebook</h1>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {TYPE_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  type === opt.value
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {tags.length > 0 && (
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="all">All tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          )}
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!isFiltering && pinned.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pinned
          </h2>
          <div className="flex flex-col gap-2">
            {pinned.map((entry) => (
              <EntryCard key={entry.id} entry={entry} tags={tags} projects={projects} onOpen={setOpenEntry} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={isFiltering ? 'Nothing matches' : 'Your notebook is empty'}
          description={
            isFiltering ? 'Try a different search or filter.' : 'Capture a thought to get started.'
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([day, dayEntries]) => (
            <section key={day} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {formatDayHeading(day)}
              </h2>
              <div className="flex flex-col gap-2">
                {dayEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    tags={tags}
                    projects={projects}
                    onOpen={setOpenEntry}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EntryDetailSheet entry={openEntry} onClose={() => setOpenEntry(null)} />
    </div>
  )
}
