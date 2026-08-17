import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { useAppLock } from '../../context/AppLockContext'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function LockScreen() {
  const { tryUnlock, disable } = useAppLock()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setChecking(true)
    const ok = await tryUnlock(pin)
    setChecking(false)
    if (!ok) {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Hub is locked</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your PIN to continue</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center gap-3">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value)
            setError(false)
          }}
          className="w-40 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg tracking-[0.5em] text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder="····"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">That PIN didn't match.</p>}
        <Button type="submit" disabled={!pin || checking} className="mt-1 w-40">
          Unlock
        </Button>
      </form>
      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        className="mt-8 text-xs text-slate-400 underline-offset-2 hover:underline dark:text-slate-500"
      >
        Forgot your PIN?
      </button>

      <ConfirmDialog
        open={confirmReset}
        title="Remove PIN lock?"
        description="This turns off the lock screen. Your entries live in separate storage and are not affected — you can set a new PIN any time in Settings. Worth remembering: this lock is a casual deterrent against a quick glance, not real security, so this reset is intentionally easy."
        confirmLabel="Remove lock"
        danger
        onConfirm={() => {
          disable()
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
