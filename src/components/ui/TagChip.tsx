import clsx from 'clsx'
import type { ReactNode } from 'react'

interface TagChipProps {
  /** Only `name`/`color` are used, so this also works for a Project. */
  tag: { name: string; color: string }
  onClick?: () => void
  size?: 'sm' | 'md'
  /** Replaces the default color dot — e.g. a folder icon for a project badge. */
  icon?: ReactNode
}

/** Read-only (or click-to-filter) tag pill, tinted with the tag's own color. */
export function TagChip({ tag, onClick, size = 'sm', icon }: TagChipProps) {
  const classes = clsx(
    'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    onClick && 'cursor-pointer hover:brightness-95',
  )
  const style = { color: tag.color, backgroundColor: `${tag.color}1a` }
  const marker = icon ?? (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} style={style}>
        {marker}
        {tag.name}
      </button>
    )
  }

  return (
    <span className={classes} style={style}>
      {marker}
      {tag.name}
    </span>
  )
}
