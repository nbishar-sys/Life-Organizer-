import clsx from 'clsx'
import { Check, FolderKanban, Mic, Pin } from 'lucide-react'
import { formatDueLabel, formatTimestamp, isOverdue, todayStr } from '../../data/dates'
import type { Entry, Project, Tag } from '../../data/types'
import { TagChip } from '../../components/ui/TagChip'
import { toggleTaskComplete } from '../../data/repository'

interface EntryCardProps {
  entry: Entry
  tags: Tag[]
  projects?: Project[]
  onOpen: (entry: Entry) => void
  /** Hide the due-date row — e.g. inside Today, where grouping already conveys it. */
  hideDueDate?: boolean
}

export function EntryCard({ entry, tags, projects = [], onOpen, hideDueDate }: EntryCardProps) {
  const entryTags = tags.filter((t) => entry.tagIds.includes(t.id))
  const project = entry.projectId ? projects.find((p) => p.id === entry.projectId) : undefined
  const overdue =
    entry.type === 'task' && !entry.completed && entry.dueDate
      ? isOverdue(entry.dueDate, todayStr())
      : false

  return (
    <div
      className={clsx(
        'flex gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
        entry.completed && 'opacity-60',
      )}
    >
      {entry.type === 'task' && (
        <button
          type="button"
          onClick={() => void toggleTaskComplete(entry.id)}
          aria-label={entry.completed ? 'Mark task incomplete' : 'Mark task complete'}
          aria-pressed={entry.completed}
          className={clsx(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            entry.completed
              ? 'border-accent-600 bg-accent-600 text-white'
              : 'border-slate-300 text-transparent hover:border-accent-500 dark:border-slate-600',
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      )}

      <button type="button" onClick={() => onOpen(entry)} className="min-w-0 flex-1 text-left">
        <p
          className={clsx(
            'whitespace-pre-wrap text-[15px] leading-snug text-slate-800 dark:text-slate-100',
            entry.completed && 'text-slate-400 line-through decoration-slate-400 dark:text-slate-500',
          )}
        >
          {entry.content}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {entry.pinned && <Pin className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />}
          {entry.source === 'voice' && <Mic className="h-3 w-3 shrink-0 text-slate-400" />}
          {entry.type === 'task' && entry.dueDate && !hideDueDate && (
            <span
              className={clsx(
                'text-xs font-medium',
                overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500',
              )}
            >
              {formatDueLabel(entry.dueDate)}
            </span>
          )}
          {entry.type !== 'task' && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatTimestamp(entry.createdAt)}
            </span>
          )}
          {project && (
            <TagChip tag={project} icon={<FolderKanban className="h-3 w-3 shrink-0" />} />
          )}
          {entryTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      </button>
    </div>
  )
}
