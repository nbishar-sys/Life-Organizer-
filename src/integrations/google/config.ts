/**
 * Google integration is entirely client-side and opt-in — there is no
 * backend in this app (see README "Architecture"), so auth uses Google
 * Identity Services' OAuth token client rather than the classic
 * server-side flow. The Client ID is a public identifier, not a secret;
 * it's fine for it to end up in the built JS bundle.
 */

export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

export function isGoogleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0
}

/**
 * Scopes this app knows how to ask for, grouped by feature so a feature can
 * request just what it needs — and so a later feature (Gmail) can request
 * an *additional* scope for an already-connected account (Google calls
 * this "incremental auth") without touching what Calendar already has.
 */
export const GOOGLE_SCOPES = {
  calendar: 'https://www.googleapis.com/auth/calendar.events',
} as const

export type GoogleScopeKey = keyof typeof GOOGLE_SCOPES
