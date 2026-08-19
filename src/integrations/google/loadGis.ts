const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let loadPromise: Promise<void> | null = null

/**
 * Loads Google Identity Services on first use — not unconditionally in
 * index.html — so nobody who never touches Google integration pays for
 * fetching it.
 */
export function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services.')),
      )
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'))
    document.head.appendChild(script)
  }).catch((err: unknown) => {
    loadPromise = null // let a later call retry instead of caching the failure forever
    throw err
  })

  return loadPromise
}
