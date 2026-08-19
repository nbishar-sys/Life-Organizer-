import { useLocation } from 'react-router-dom'
import { Sheet } from '../../components/ui/Sheet'
import { EntryForm, type EntryFormValues } from '../entries/EntryForm'
import { createEntry } from '../../data/repository'
import { useToast } from '../../context/ToastContext'
import { buildGithubIssueUrl } from '../../lib/github'
import { BUILTIN_TAG_FEEDBACK } from '../../data/types'

interface FeedbackSheetProps {
  open: boolean
  onClose: () => void
  draft?: Partial<EntryFormValues>
  onDraftChange?: (values: EntryFormValues) => void
}

const PAGE_LABELS: Record<string, string> = {
  '/today': 'Today',
  '/notebook': 'Notebook',
  '/projects': 'Projects',
  '/inbox': 'Inbox',
  '/settings': 'Settings',
}

function currentPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname]
  if (pathname.startsWith('/projects/')) return 'a project page'
  return pathname
}

/**
 * A "report a bug or idea" button gets the same fleeting-thought problem
 * this whole app exists to solve — so it reuses the exact same capture
 * form, just pre-tagged Feedback. Saved locally like everything else;
 * turning it into a real GitHub issue is a separate, explicit step.
 */
export function FeedbackSheet({ open, onClose, draft, onDraftChange }: FeedbackSheetProps) {
  const { showToast } = useToast()
  const location = useLocation()

  async function handleSubmit(values: EntryFormValues) {
    const context = currentPageLabel(location.pathname)
    const content = `${values.content}\n\n— via ${context}`
    const tagIds = values.tagIds.includes(BUILTIN_TAG_FEEDBACK)
      ? values.tagIds
      : [...values.tagIds, BUILTIN_TAG_FEEDBACK]

    await createEntry({ ...values, content, tagIds })
    onDraftChange?.({
      content: '',
      type: 'note',
      tagIds: [BUILTIN_TAG_FEEDBACK],
      projectId: null,
      dueDate: null,
      journalDate: null,
      pinned: false,
      source: 'typed',
    })
    onClose()
    showToast('Feedback saved — find it any time in Notebook, tagged Feedback.', {
      actionLabel: 'Open on GitHub',
      onAction: () => {
        window.open(buildGithubIssueUrl('Hub feedback', content), '_blank', 'noopener,noreferrer')
      },
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Report a bug or idea">
      {open && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Saved on this device, tagged{' '}
            <span className="font-medium text-red-600 dark:text-red-400">Feedback</span> — nothing
            leaves this device unless you choose to open it on GitHub afterward.
          </p>
          <EntryForm
            initial={draft ?? { tagIds: [BUILTIN_TAG_FEEDBACK] }}
            onDraftChange={onDraftChange}
            submitLabel="Save feedback"
            onSubmit={handleSubmit}
            autoFocus
          />
        </div>
      )}
    </Sheet>
  )
}
