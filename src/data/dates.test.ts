import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysOverdue,
  formatDayHeading,
  formatDueLabel,
  isOverdue,
  parseDateStr,
  toDateStr,
} from './dates'

describe('toDateStr / parseDateStr', () => {
  it('round-trip without a UTC-boundary shift near midnight', () => {
    const d = new Date(2026, 0, 15, 23, 45) // Jan 15, 2026, 11:45pm local
    expect(toDateStr(d)).toBe('2026-01-15')
    const parsed = parseDateStr('2026-01-15')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(0)
    expect(parsed.getDate()).toBe(15)
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28') // 2026 is not a leap year
  })
})

describe('daysOverdue', () => {
  it('is positive in the past, negative in the future, zero for today', () => {
    expect(daysOverdue('2026-08-10', '2026-08-17')).toBe(7)
    expect(daysOverdue('2026-08-20', '2026-08-17')).toBe(-3)
    expect(daysOverdue('2026-08-17', '2026-08-17')).toBe(0)
  })
})

describe('isOverdue', () => {
  it('is true only strictly before today', () => {
    expect(isOverdue('2026-08-16', '2026-08-17')).toBe(true)
    expect(isOverdue('2026-08-17', '2026-08-17')).toBe(false)
    expect(isOverdue('2026-08-18', '2026-08-17')).toBe(false)
  })
})

describe('formatDueLabel', () => {
  it('names today/tomorrow/yesterday and counts days overdue beyond that', () => {
    expect(formatDueLabel('2026-08-17', '2026-08-17')).toBe('Today')
    expect(formatDueLabel('2026-08-18', '2026-08-17')).toBe('Tomorrow')
    expect(formatDueLabel('2026-08-16', '2026-08-17')).toBe('Yesterday')
    expect(formatDueLabel('2026-08-10', '2026-08-17')).toBe('7 days overdue')
  })
})

describe('formatDayHeading', () => {
  it('mirrors the same today/tomorrow/yesterday special-casing', () => {
    expect(formatDayHeading('2026-08-17', '2026-08-17')).toBe('Today')
    expect(formatDayHeading('2026-08-18', '2026-08-17')).toBe('Tomorrow')
    expect(formatDayHeading('2026-08-16', '2026-08-17')).toBe('Yesterday')
  })
})
