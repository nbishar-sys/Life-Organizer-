import { forwardRef, type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only buttons must still be labeled for screen readers. */
  label: string
  active?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, active, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 dark:text-slate-300 dark:hover:bg-slate-800',
        active && 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300',
        className,
      )}
      {...props}
    />
  )
})
