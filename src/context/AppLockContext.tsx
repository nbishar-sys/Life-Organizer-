import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { sha256Hex } from '../lib/crypto'

const ENABLED_KEY = 'hub:lock:enabled'
const HASH_KEY = 'hub:lock:hash'
const SESSION_UNLOCKED_KEY = 'hub:lock:unlocked'

interface AppLockContextValue {
  /** Whether a PIN lock is currently configured. */
  enabled: boolean
  /** Whether the app should currently show its content (false = show the lock screen). */
  unlocked: boolean
  /** Turns the lock on with a new PIN. */
  setPin: (pin: string) => Promise<void>
  /** Turns the lock off entirely. */
  disable: () => void
  /** Checks a PIN attempt; unlocks the session on success. Returns whether it matched. */
  tryUnlock: (pin: string) => Promise<boolean>
  /** Re-locks immediately, e.g. a "Lock now" button in Settings. */
  lockNow: () => void
}

const AppLockContext = createContext<AppLockContextValue | null>(null)

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(ENABLED_KEY) === '1')
  const [unlocked, setUnlocked] = useState(
    () =>
      localStorage.getItem(ENABLED_KEY) !== '1' ||
      sessionStorage.getItem(SESSION_UNLOCKED_KEY) === '1',
  )

  const setPin = useCallback(async (pin: string) => {
    const hash = await sha256Hex(pin)
    localStorage.setItem(HASH_KEY, hash)
    localStorage.setItem(ENABLED_KEY, '1')
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, '1')
    setEnabled(true)
    setUnlocked(true)
  }, [])

  const disable = useCallback(() => {
    localStorage.removeItem(HASH_KEY)
    localStorage.removeItem(ENABLED_KEY)
    setEnabled(false)
    setUnlocked(true)
  }, [])

  const tryUnlock = useCallback(async (pin: string) => {
    const stored = localStorage.getItem(HASH_KEY)
    if (!stored) return true
    const hash = await sha256Hex(pin)
    const ok = hash === stored
    if (ok) {
      sessionStorage.setItem(SESSION_UNLOCKED_KEY, '1')
      setUnlocked(true)
    }
    return ok
  }, [])

  const lockNow = useCallback(() => {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY)
    setUnlocked(false)
  }, [])

  return (
    <AppLockContext.Provider value={{ enabled, unlocked, setPin, disable, tryUnlock, lockNow }}>
      {children}
    </AppLockContext.Provider>
  )
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext)
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider')
  return ctx
}
