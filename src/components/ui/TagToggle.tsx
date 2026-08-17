import clsx from 'clsx'
import type { Tag } from '../../data/types'

interface TagToggleProps {
  tag: Tag
  selected: boolean
  onToggle: () => void
}

/** Selectable tag pill used in the capture flow's "tag this" row. */
export function TagToggle({ tag, selected, onToggle }: TagToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-transparent text-white'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600',
      )}
      style={selected ? { backgroundColor: tag.color } : undefined}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: selected ? 'rgba(255,255,255,0.9)' : tag.color }}
      />
      {tag.name}
    </button>
  )
}
