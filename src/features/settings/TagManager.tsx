import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import clsx from 'clsx'
import { createTag, softDeleteTag } from '../../data/repository'
import { useTags } from '../../hooks/useTags'
import { TagChip } from '../../components/ui/TagChip'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { Tag } from '../../data/types'

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

export function TagManager() {
  const tags = useTags() ?? []
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[0])
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null)

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    await createTag(trimmed, color)
    setName('')
    setColor(SWATCHES[Math.floor(Math.random() * SWATCHES.length)])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="group relative">
            <TagChip tag={tag} size="md" />
            <button
              type="button"
              onClick={() => setPendingDelete(tag)}
              aria-label={`Delete tag ${tag.name}`}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
            >
              <X className="h-2.5 w-2.5" strokeWidth={3} />
            </button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-sm text-slate-400">No tags yet.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
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
                color === swatch && 'scale-110 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900',
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New tag name"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim()}
          aria-label="Add tag"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white transition-opacity disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name ?? ''}"?`}
        description="This removes the tag from every entry that has it. The entries themselves are kept."
        confirmLabel="Delete tag"
        danger
        onConfirm={async () => {
          if (pendingDelete) await softDeleteTag(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
