import { describe, expect, it } from 'vitest'
import { buildGithubIssueUrl } from './github'

describe('buildGithubIssueUrl', () => {
  it('points at the repo\'s new-issue page with title/body/labels encoded', () => {
    const url = buildGithubIssueUrl('Hub feedback', 'The mic button is hard to see in dark mode')
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      'https://github.com/nbishar-sys/arborvacuum-central-hub/issues/new',
    )
    expect(parsed.searchParams.get('title')).toBe('Hub feedback')
    expect(parsed.searchParams.get('body')).toBe('The mic button is hard to see in dark mode')
    expect(parsed.searchParams.get('labels')).toBe('feedback')
  })

  it('safely encodes special characters (&, newlines, emoji) in the body', () => {
    const body = 'Line one\n\nLine two & <weird> stuff 🐛'
    const url = buildGithubIssueUrl('Hub feedback', body)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('body')).toBe(body)
  })
})
