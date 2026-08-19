/**
 * Hands off a feedback entry to GitHub as a pre-filled "New issue" link —
 * no API call, no auth, no backend. It just opens github.com with the
 * title/body already typed in; the user still reviews and clicks "Submit"
 * themselves.
 */
const REPO = 'nbishar-sys/life-organizer-'

export function buildGithubIssueUrl(title: string, body: string): string {
  const params = new URLSearchParams({ title, body, labels: 'feedback' })
  return `https://github.com/${REPO}/issues/new?${params.toString()}`
}
