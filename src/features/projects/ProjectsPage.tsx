import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderKanban, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useProjects } from '../../hooks/useProjects'
import { useEntries } from '../../hooks/useEntries'
import { createProject } from '../../data/repository'
import { countOpenProjectEntries } from '../../data/selectors'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import type { Project } from '../../data/types'

const SWATCHES = [
  '#4f46e5',
  '#0d9488',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
]

export function ProjectsPage() {
  const projects = useProjects() ?? []
  const entries = useEntries() ?? []
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[0])
  const [showArchived, setShowArchived] = useState(false)

  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status === 'archived')

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    const project = await createProject(trimmed, color)
    setName('')
    setColor(SWATCHES[Math.floor(Math.random() * SWATCHES.length)])
    setCreating(false)
    navigate(`/projects/${project.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Long-term things you don&rsquo;t want to lose but that don&rsquo;t belong on a daily
          list — a house renovation, a trip, a career move.
        </p>
      </header>

      {creating ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={`Use color ${swatch}`}
                aria-pressed={color === swatch}
                className={clsx(
                  'h-6 w-6 rounded-full transition-transform',
                  color === swatch &&
                    'scale-110 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900',
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. House renovation"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
              Create project
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-3.5 text-left text-[15px] text-slate-400 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-accent-500 dark:hover:text-accent-400"
        >
          <Plus className="h-5 w-5 shrink-0" />
          New project
        </button>
      )}

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-9 w-9" />}
          title="No projects yet"
          description={
            'Something like "House renovation" or "Plan the trip" — a home for related thoughts that isn’t your daily list.'
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              openCount={countOpenProjectEntries(entries, project.id)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="self-start text-sm font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="flex flex-col gap-2">
              {archived.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  openCount={countOpenProjectEntries(entries, project.id)}
                  archived
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectRow({
  project,
  openCount,
  archived,
}: {
  project: Project
  openCount: number
  archived?: boolean
}) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className={clsx(
        'flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
        archived && 'opacity-60',
      )}
    >
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
      <span className="flex-1 truncate text-[15px] font-medium text-slate-800 dark:text-slate-100">
        {project.name}
      </span>
      {openCount > 0 && (
        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{openCount} open</span>
      )}
    </Link>
  )
}
