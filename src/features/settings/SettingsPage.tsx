import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useTheme, type ThemePreference } from '../../context/ThemeContext'
import { TagManager } from './TagManager'
import { PinLockSettings } from './PinLockSettings'
import { DataBackup } from './DataBackup'

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </header>

      <SettingsSection title="Appearance">
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={clsx(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                theme === opt.value
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Tags"
        description="Work, Personal, and anything else you want to slice your entries by."
      >
        <TagManager />
      </SettingsSection>

      <SettingsSection title="App lock">
        <PinLockSettings />
      </SettingsSection>

      <SettingsSection
        title="Your data"
        description="Local-first: everything below is about backup, not sync. See the README for what that means today and what's planned next."
      >
        <DataBackup />
      </SettingsSection>

      <footer className="pb-4 text-center text-xs text-slate-400 dark:text-slate-600">
        Hub · a local-first planner, notebook &amp; journal
      </footer>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </section>
  )
}
