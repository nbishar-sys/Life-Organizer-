import { useState } from 'react'
import { useAppLock } from '../../context/AppLockContext'
import { Button } from '../../components/ui/Button'

export function PinLockSettings() {
  const { enabled, setPin, disable, lockNow } = useAppLock()
  const [editing, setEditing] = useState(false)
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (pin.length < 4) {
      setError('Use at least 4 digits.')
      return
    }
    if (pin !== confirmPin) {
      setError("PINs don't match.")
      return
    }
    await setPin(pin)
    setEditing(false)
    setPinValue('')
    setConfirmPin('')
    setError(null)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            placeholder="New PIN"
            value={pin}
            onChange={(e) => setPinValue(e.target.value)}
            className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <input
            type="password"
            inputMode="numeric"
            placeholder="Confirm"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            Save PIN
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {enabled
          ? 'A PIN currently guards the app on open.'
          : 'No PIN set — anyone with this device can open Hub.'}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        This is a casual deterrent against a quick glance, not real security — the data
        underneath isn&rsquo;t encrypted. Don&rsquo;t rely on it for anything truly sensitive.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          {enabled ? 'Change PIN' : 'Set a PIN'}
        </Button>
        {enabled && (
          <>
            <Button size="sm" variant="secondary" onClick={lockNow}>
              Lock now
            </Button>
            <Button size="sm" variant="ghost" onClick={disable}>
              Turn off
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
