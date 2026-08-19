import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Archive, ArchiveRestore, ArrowLeft, Trash2 } from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import { useEntries } from '../../hooks/useEntries'
import { useTags } from '../../hooks/useTags'
import { selectProjectEntries } from '../../data/selectors'
import { createEntry, setProjectStatus, softDeleteProject } from '../../data/repository'
import { EntryForm, type EntryFormValues } from '../entries/EntryForm'
import { EntryCard } from '../entries/EntryCard'
import { EntryDetailSheet } from '../entries/EntryDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconButton } from '../../components/ui/IconButton'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { Entry } from '../../data/types'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projects = useProjects()
  const entries = useEntries()
  const tags = useTags() ?? []
  const [openEntry, setOpenEntry] = useState<Entry | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const project = projects?.find((p) => p.id === id)
  const projectEntries = useMemo(
    () => (entries && id ? selectProjectEntries(entries, id) : []),
    [entries, id],
  )

  // Projects have loaded and this id genuinely doesn't match one anymore
  // (e.g. deleted from another tab) — bail out gracefully instead of
  // rendering a blank scoped-capture form for nothing.
  if (projects && !project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted."
        action={
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
      />
    )
  }
  if (!project || !entries) return null // brief flash while IndexedDB loads

  // Arrow function, not a hoisted `function` declaration — TS's narrowing of
  // `project` above only carries into closures created after the guard ran.
  const handleCapture = async (values: EntryFormValues) => {
    await createEntry({ ...values, projectId: project.id })
    setFormKey((k) => k + 1) // remount the form so it starts blank again
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1">
        <IconButton label="Back to Projects" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <span
          className="ml-1 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <h1 className="ml-2 flex-1 truncate text-xl font-bold text-slate-900 dark:text-white">
          {project.name}
        </h1>
        {project.status === 'active' ? (
          <IconButton
            label="Archive project"
            onClick={() => void setProjectStatus(project.id, 'archived')}
          >
            <Archive className="h-5 w-5" />
          </IconButton>
        ) : (
          <IconButton
            label="Unarchive project"
            onClick={() => void setProjectStatus(project.id, 'active')}
          >
            <ArchiveRestore className="h-5 w-5" />
          </IconButton>
        )}
        <IconButton label="Delete project" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-5 w-5" />
        </IconButton>
      </div>

      {project.status === 'archived' && (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Archived — still here, just out of the way. Unarchive any time.
        </p>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <EntryForm
          key={formKey}
          initial={{ projectId: project.id }}
          submitLabel="Add to project"
          onSubmit={handleCapture}
        />
      </div>

      {projectEntries.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Whatever's on your mind about this project — add it above."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {projectEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} tags={tags} onOpen={setOpenEntry} />
          ))}
        </div>
      )}

      <EntryDetailSheet entry={openEntry} onClose={() => setOpenEntry(null)} />

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${project.name}"?`}
        description="This removes the project. Everything you captured under it stays in your Notebook — it just won't be grouped here anymore."
        confirmLabel="Delete project"
        danger
        onConfirm={async () => {
          await softDeleteProject(project.id)
          navigate('/projects')
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
