import { useEffect, useState } from 'react'

/** Small persisted-state helper for app preferences (theme, lock settings, …). */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or unavailable (e.g. private browsing) — the app still
      // works, it just won't remember this preference.
    }
  }, [key, value])

  return [value, setValue] as const
}
