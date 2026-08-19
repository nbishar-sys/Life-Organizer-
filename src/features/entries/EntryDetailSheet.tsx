import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Sheet } from '../../components/ui/Sheet'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EntryForm, type EntryFormValues } from './EntryForm'
import { restoreEntry, softDeleteEntry, updateEntry } from '../../data/repository'
import { useToast } from '../../context/ToastContext'
import { buildGithubIssueUrl } from '../../lib/github'
import { BUILTIN_TAG_FEEDBACK, type Entry } from '../../data/types'

interface EntryDetailSheetProps {
  entry: Entry | null
  onClose: () => void
}

/** Reused by every list view (Today / Notebook / Inbox) to view, edit, or delete an entry. */
export function EntryDetailSheet({ entry, onClose }: EntryDetailSheetProps) {
  const { showToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!entry) return null
  const current = entry

  async function handleSubmit(values: EntryFormValues) {
    await updateEntry(current.id, values)
    onClose()
  }

  async function handleDelete() {
    await softDeleteEntry(current.id)
    setConfirmDelete(false)
    onClose()
    showToast('Entry deleted', {
      actionLabel: 'Undo',
      onAction: () => {
        void restoreEntry(current.id)
      },
    })
  }

  return (
    <>
      <Sheet open onClose={onClose} title="Edit entry">
        {current.tagIds.includes(BUILTIN_TAG_FEEDBACK) && (
          <button
            type="button"
            onClick={() =>
              window.open(
                buildGithubIssueUrl('Hub feedback', current.content),
                '_blank',
                'noopener,noreferrer',
              )
            }
            className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
          >
            <ExternalLink className="h-4 w-4" />
            Open on GitHub
          </button>
        )}
        <EntryForm
          key={current.id}
          initial={current}
          submitLabel="Save"
          onSubmit={handleSubmit}
          onDelete={() => setConfirmDelete(true)}
        />
      </Sheet>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this entry?"
        description="It'll disappear from every list. You can undo this for a few seconds right after."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
