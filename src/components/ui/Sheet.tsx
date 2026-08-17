import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** A bottom sheet on mobile, a centered dialog on wider screens. Portaled to
 * `document.body` so it always sits above the app shell regardless of where
 * it's rendered from. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:max-w-lg sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
