import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Mic, MicOff, Pin } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../../components/ui/Button'
import { TagToggle } from '../../components/ui/TagToggle'
import { useTags } from '../../hooks/useTags'
import { useProjects } from '../../hooks/useProjects'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { addDays, todayStr } from '../../data/dates'
import type { CaptureSource, Entry, EntryType } from '../../data/types'

export interface EntryFormValues {
  content: string
  type: EntryType
  tagIds: string[]
  projectId: string | null
  dueDate: string | null
  journalDate: string | null
  pinned: boolean
  source: CaptureSource
}

interface EntryFormProps {
  initial?: Partial<Entry>
  submitLabel: string
  onSubmit: (values: EntryFormValues) => void | Promise<void>
  onDelete?: () => void
  autoFocus?: boolean
  /**
   * Fired on every change so a parent can hold onto an in-progress draft.
   * Used by quick-capture so an accidental tap-outside-to-close doesn't
   * throw away a half-typed thought — the whole point of the feature.
   */
  onDraftChange?: (values: EntryFormValues) => void
}

const TYPE_OPTIONS: Array<{ value: EntryType; label: string }> = [
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
  { value: 'journal', label: 'Journal' },
]

export function EntryForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  autoFocus,
  onDraftChange,
}: EntryFormProps) {
  const tags = useTags()
  const projects = useProjects()
  const [content, setContent] = useState(initial?.content ?? '')
  const [type, setType] = useState<EntryType>(initial?.type ?? 'note')
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? [])
  const [projectId, setProjectId] = useState<string | null>(initial?.projectId ?? null)
  const [dueDate, setDueDate] = useState<string | null>(initial?.dueDate ?? null)
  const [journalDate, setJournalDate] = useState<string | null>(initial?.journalDate ?? null)
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [source, setSource] = useState<CaptureSource>(initial?.source ?? 'typed')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onDraftChangeRef = useRef(onDraftChange)
  onDraftChangeRef.current = onDraftChange

  useEffect(() => {
    onDraftChangeRef.current?.({
      content,
      type,
      tagIds,
      projectId,
      dueDate,
      journalDate,
      pinned,
      source,
    })
  }, [content, type, tagIds, projectId, dueDate, journalDate, pinned, source])

  const {
    isSupported,
    isListening,
    interimTranscript,
    error: speechError,
    start,
    stop,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      setSource('voice')
      setContent((prev) => (prev.trim().length ? `${prev.trim()} ${text}` : text))
    },
  })

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  function handleTypeChange(next: EntryType) {
    setType(next)
    if (next === 'task' && !dueDate) setDueDate(todayStr())
    if (next === 'journal' && !journalDate) setJournalDate(todayStr())
  }

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        content: trimmed,
        type,
        tagIds,
        projectId,
        dueDate: type === 'task' ? dueDate : null,
        journalDate: type === 'journal' ? journalDate : null,
        pinned,
        source,
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setSource('typed')
          }}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="What's on your mind?"
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-12 text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={isListening ? stop : start}
          disabled={!isSupported}
          aria-label={isListening ? 'Stop voice capture' : 'Start voice capture'}
          title={isSupported ? 'Voice capture' : 'Voice capture not supported in this browser'}
          className={clsx(
            'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
            isListening
              ? 'animate-pulse bg-red-500 text-white'
              : 'text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800',
          )}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      {isListening && (
        <p className="-mt-2 text-xs text-slate-400 dark:text-slate-500">
          {interimTranscript || 'Listening…'}
        </p>
      )}
      {speechError && (
        <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">{speechError}</p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
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
        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          aria-pressed={pinned}
          aria-label={pinned ? 'Unpin this entry' : 'Pin this entry'}
          title={pinned ? 'Unpin' : 'Pin this entry'}
          className={clsx(
            'ml-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors',
            pinned
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
              : 'text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800',
          )}
        >
          <Pin className={clsx('h-4 w-4', pinned && 'fill-current')} />
        </button>
      </div>

      {projects && projects.length > 0 && (
        <ProjectPicker projects={projects} value={projectId} onChange={setProjectId} />
      )}

      {type === 'task' && <DueDatePicker value={dueDate} onChange={setDueDate} />}

      {type === 'journal' && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Reflecting on</span>
          <input
            type="date"
            value={journalDate ?? todayStr()}
            onChange={(e) => setJournalDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagToggle
              key={tag.id}
              tag={tag}
              selected={tagIds.includes(tag.id)}
              onToggle={() => toggleTag(tag.id)}
            />
          ))}
        </div>
      )}

      <div className={clsx('flex items-center gap-2 pt-1', onDelete ? 'justify-between' : 'justify-end')}>
        {onDelete && (
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!content.trim() || submitting}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: Array<{ id: string; name: string; status: string }>
  value: string | null
  onChange: (id: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">Project</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="">No project — everyday note</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
            {project.status === 'archived' ? ' (archived)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function DueDatePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string) => void
}) {
  const today = todayStr()
  const tomorrow = addDays(today, 1)
  const nextWeek = addDays(today, 7)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <QuickDateButton label="Today" date={today} selected={value === today} onSelect={onChange} />
      <QuickDateButton
        label="Tomorrow"
        date={tomorrow}
        selected={value === tomorrow}
        onSelect={onChange}
      />
      <QuickDateButton
        label="Next week"
        date={nextWeek}
        selected={value === nextWeek}
        onSelect={onChange}
      />
      <input
        type="date"
        value={value ?? today}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      />
    </div>
  )
}

function QuickDateButton({
  label,
  date,
  selected,
  onSelect,
}: {
  label: string
  date: string
  selected: boolean
  onSelect: (date: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={clsx(
        'rounded-full px-3 py-1 text-sm font-medium transition-colors',
        selected
          ? 'bg-accent-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
      )}
    >
      {label}
    </button>
  )
}
