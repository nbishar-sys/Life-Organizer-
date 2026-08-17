import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CheckCircle2, Plus, Sparkles } from 'lucide-react'
import { useEntries } from '../../hooks/useEntries'
import { useTags } from '../../hooks/useTags'
import { selectCompletedToday, selectTodayJournalEntries, selectTodayTasks } from '../../data/selectors'
import { EntryCard } from '../entries/EntryCard'
import { EntryDetailSheet } from '../entries/EntryDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import type { AppOutletContext } from '../../components/layout/outletContext'
import type { Entry } from '../../data/types'

function todayHeading(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function TodayPage() {
  const { openCapture } = useOutletContext<AppOutletContext>()
  const entries = useEntries()
  const tags = useTags() ?? []
  const [openEntry, setOpenEntry] = useState<Entry | null>(null)

  const tasks = useMemo(() => (entries ? selectTodayTasks(entries) : []), [entries])
  const journalEntries = useMemo(() => (entries ? selectTodayJournalEntries(entries) : []), [entries])
  const completedToday = useMemo(() => (entries ? selectCompletedToday(entries) : []), [entries])

  if (!entries) return null // brief flash while the first IndexedDB read resolves

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm font-medium text-accent-600 dark:text-accent-400">{todayHeading()}</p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">Today</h1>
      </header>

      <button
        type="button"
        onClick={openCapture}
        className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-3.5 text-left text-[15px] text-slate-400 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-accent-500 dark:hover:text-accent-400"
      >
        <Plus className="h-5 w-5 shrink-0" />
        What&rsquo;s on your mind?
      </button>

      <section className="flex flex-col gap-3">
        <SectionHeading title="Tasks" count={tasks.length} />
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-9 w-9" />}
            title="Nothing on your plate today"
            description="Capture a thought and mark it as a task to see it here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((entry) => (
              <EntryCard key={entry.id} entry={entry} tags={tags} onOpen={setOpenEntry} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading title="Journal" count={journalEntries.length} />
        {journalEntries.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-9 w-9" />}
            title="No reflections yet today"
            description="A line or two counts. Future you will appreciate it."
            action={
              <Button variant="secondary" onClick={openCapture}>
                Write something
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {journalEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} tags={tags} onOpen={setOpenEntry} />
            ))}
          </div>
        )}
      </section>

      {completedToday.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Completed today" count={completedToday.length} />
          <div className="flex flex-col gap-2">
            {completedToday.map((entry) => (
              <EntryCard key={entry.id} entry={entry} tags={tags} onOpen={setOpenEntry} />
            ))}
          </div>
        </section>
      )}

      <EntryDetailSheet entry={openEntry} onClose={() => setOpenEntry(null)} />
    </div>
  )
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      {count > 0 && <span className="text-sm text-slate-400 dark:text-slate-500">{count}</span>}
    </div>
  )
}
