import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastState {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface ShowToastOptions {
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const showToast = useCallback((message: string, options?: ShowToastOptions) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    const id = ++idRef.current
    setToast({ id, message, actionLabel: options?.actionLabel, onAction: options?.onAction })
    timeoutRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, options?.durationMs ?? 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-6"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-800">
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                className="font-semibold text-accent-300 hover:text-accent-200"
                onClick={() => {
                  toast.onAction?.()
                  setToast(null)
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
