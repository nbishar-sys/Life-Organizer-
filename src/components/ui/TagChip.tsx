import clsx from 'clsx'
import type { Tag } from '../../data/types'

interface TagChipProps {
  tag: Tag
  onClick?: () => void
  size?: 'sm' | 'md'
}

/** Read-only (or click-to-filter) tag pill, tinted with the tag's own color. */
export function TagChip({ tag, onClick, size = 'sm' }: TagChipProps) {
  const classes = clsx(
    'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    onClick && 'cursor-pointer hover:brightness-95',
  )
  const style = { color: tag.color, backgroundColor: `${tag.color}1a` }
  const dot = (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} style={style}>
        {dot}
        {tag.name}
      </button>
    )
  }

  return (
    <span className={classes} style={style}>
      {dot}
      {tag.name}
    </span>
  )
}
