// Ambient types for the slice of Google Identity Services (GIS) this app
// uses. Google ships no official TS types for the plain <script> global —
// only for the @types/google.accounts npm package, which we're avoiding to
// keep this dependency-free like the rest of the app's browser-API usage.

export {}

declare global {
  interface GoogleTokenResponse {
    access_token: string
    /** Seconds until expiry, from when the response was received. */
    expires_in: number
    /** Space-separated scopes actually granted (can be a superset or subset of what was requested). */
    scope: string
    token_type: string
    error?: string
    error_description?: string
  }

  interface GoogleTokenClientConfig {
    client_id: string
    /** Space-separated scope string. */
    scope: string
    /** '' requests a silent/no-UI renewal; omit or 'consent'/'select_account' to force UI. */
    prompt?: '' | 'consent' | 'select_account'
    /** Email to target a specific account for silent renewal. */
    hint?: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: { type: string; message?: string }) => void
  }

  interface GoogleTokenClient {
    requestAccessToken(overrideConfig?: { prompt?: string; hint?: string }): void
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient
          revoke(accessToken: string, done?: () => void): void
        }
      }
    }
  }
}
