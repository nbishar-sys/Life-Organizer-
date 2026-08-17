/**
 * SHA-256 hex digest, used only for the optional local PIN lock.
 * This is a casual-glance deterrent, not real security — see the copy in
 * Settings and the README. The hash sits in localStorage right next to the
 * data it's "protecting."
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
