import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Inbox as InboxIcon } from 'lucide-react'
import { useEntries } from '../../hooks/useEntries'
import { useTags } from '../../hooks/useTags'
import { useProjects } from '../../hooks/useProjects'
import { selectInboxEntries } from '../../data/selectors'
import { InboxItem } from './InboxItem'
import { EntryDetailSheet } from '../entries/EntryDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import type { AppOutletContext } from '../../components/layout/outletContext'
import type { Entry } from '../../data/types'

export function InboxPage() {
  const { openCapture } = useOutletContext<AppOutletContext>()
  const entries = useEntries()
  const tags = useTags() ?? []
  const projects = useProjects() ?? []
  const [openEntry, setOpenEntry] = useState<Entry | null>(null)

  const inboxEntries = useMemo(() => (entries ? selectInboxEntries(entries) : []), [entries])

  if (!entries) return null

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inbox</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Quick captures waiting to be tagged, dated, or turned into a task. Nothing here is
          required reading — Notebook already has everything.
        </p>
      </header>

      {inboxEntries.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-9 w-9" />}
          title="Inbox zero"
          description="Everything you've captured has a home. Nice."
          action={
            <Button variant="secondary" onClick={openCapture}>
              Capture something
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {inboxEntries.map((entry) => (
            <InboxItem key={entry.id} entry={entry} tags={tags} projects={projects} onOpen={setOpenEntry} />
          ))}
        </div>
      )}

      <EntryDetailSheet entry={openEntry} onClose={() => setOpenEntry(null)} />
    </div>
  )
}
