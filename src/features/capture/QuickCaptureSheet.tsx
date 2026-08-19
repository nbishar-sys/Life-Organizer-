import { Sheet } from '../../components/ui/Sheet'
import { EntryForm, type EntryFormValues } from '../entries/EntryForm'
import { createEntry } from '../../data/repository'

interface QuickCaptureSheetProps {
  open: boolean
  onClose: () => void
  /** In-progress draft, preserved by the parent across close/reopen. */
  draft?: Partial<EntryFormValues>
  onDraftChange?: (values: EntryFormValues) => void
}

export function QuickCaptureSheet({ open, onClose, draft, onDraftChange }: QuickCaptureSheetProps) {
  async function handleSubmit(values: EntryFormValues) {
    await createEntry(values)
    onDraftChange?.({
      content: '',
      type: 'note',
      tagIds: [],
      projectId: null,
      dueDate: null,
      journalDate: null,
      pinned: false,
      source: 'typed',
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Capture a thought">
      {open && (
        <EntryForm
          initial={draft}
          onDraftChange={onDraftChange}
          submitLabel="Save"
          onSubmit={handleSubmit}
          autoFocus
        />
      )}
    </Sheet>
  )
}
