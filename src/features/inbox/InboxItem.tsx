import { Mic } from 'lucide-react'
import { formatTimestamp, todayStr } from '../../data/dates'
import { updateEntry } from '../../data/repository'
import { TagToggle } from '../../components/ui/TagToggle'
import { BUILTIN_TAG_PERSONAL, BUILTIN_TAG_WORK, type Entry, type Project, type Tag } from '../../data/types'

interface InboxItemProps {
  entry: Entry
  tags: Tag[]
  projects: Project[]
  onOpen: (entry: Entry) => void
}

/** One-tap triage row: turn a bare capture into a tagged/dated/typed entry
 * without opening the full editor, for the common cases. */
export function InboxItem({ entry, tags, projects, onOpen }: InboxItemProps) {
  const workTag = tags.find((t) => t.id === BUILTIN_TAG_WORK)
  const personalTag = tags.find((t) => t.id === BUILTIN_TAG_PERSONAL)
  const activeProjects = projects.filter((p) => p.status === 'active')

  function quickTag(tagId: string) {
    void updateEntry(entry.id, { tagIds: [...entry.tagIds, tagId] })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button type="button" onClick={() => onOpen(entry)} className="text-left">
        <p className="whitespace-pre-wrap text-[15px] leading-snug text-slate-800 dark:text-slate-100">
          {entry.content}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          {entry.source === 'voice' && <Mic className="h-3 w-3" />}
          {formatTimestamp(entry.createdAt)}
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        {workTag && <TagToggle tag={workTag} selected={false} onToggle={() => quickTag(workTag.id)} />}
        {personalTag && (
          <TagToggle tag={personalTag} selected={false} onToggle={() => quickTag(personalTag.id)} />
        )}
        <button
          type="button"
          onClick={() => void updateEntry(entry.id, { type: 'task', dueDate: todayStr() })}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Make it a task
        </button>
        <button
          type="button"
          onClick={() => void updateEntry(entry.id, { type: 'journal', journalDate: todayStr() })}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Journal it
        </button>
        {activeProjects.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) void updateEntry(entry.id, { projectId: e.target.value })
            }}
            className="rounded-full border-none bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 outline-none transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <option value="" disabled>
              Add to project
            </option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => onOpen(entry)}
          className="ml-auto text-sm font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
