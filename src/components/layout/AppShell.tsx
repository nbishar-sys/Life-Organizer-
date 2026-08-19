import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Bug, Plus, Settings } from 'lucide-react'
import clsx from 'clsx'
import { MOBILE_NAV_ITEMS, NAV_ITEMS, type NavItem } from './navItems'
import { useEntries } from '../../hooks/useEntries'
import { selectInboxEntries } from '../../data/selectors'
import { QuickCaptureSheet } from '../../features/capture/QuickCaptureSheet'
import { FeedbackSheet } from '../../features/feedback/FeedbackSheet'
import { IconButton } from '../ui/IconButton'
import type { EntryFormValues } from '../../features/entries/EntryForm'
import type { AppOutletContext } from './outletContext'

export function AppShell() {
  const [captureOpen, setCaptureOpen] = useState(false)
  // Lives here (not inside the sheet) so an accidental tap-outside-to-close
  // doesn't discard a half-typed thought — reopening restores it.
  const [captureDraft, setCaptureDraft] = useState<Partial<EntryFormValues>>()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackDraft, setFeedbackDraft] = useState<Partial<EntryFormValues>>()
  const entries = useEntries()
  const inboxCount = useMemo(() => (entries ? selectInboxEntries(entries).length : 0), [entries])

  // Global "press C to capture" shortcut, ignored while typing anywhere or
  // holding a modifier (so it never steals Cmd/Ctrl+C copy).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key !== 'c' && e.key !== 'C') return
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (isTyping) return
      e.preventDefault()
      setCaptureOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-full md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 border-r border-slate-100 md:flex md:w-56 md:flex-col md:py-6 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 pb-6">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Hub</span>
          <IconButton label="Report a bug or idea" onClick={() => setFeedbackOpen(true)}>
            <Bug className="h-5 w-5" />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          className="mx-4 mb-6 flex items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
        >
          <Plus className="h-4 w-4" />
          New entry
          <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-normal">C</kbd>
        </button>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.to === '/inbox' && inboxCount > 0 && (
                <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {inboxCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-h-full flex-1 pb-24 md:pb-8">
        {/* Mobile-only header: sidebar carries branding + Settings on
            desktop, but the bottom tab bar deliberately excludes Settings
            (see navItems.ts), so it needs a home here instead. */}
        <div className="flex items-center justify-between px-4 pt-4 md:hidden">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Hub</span>
          <div className="flex items-center gap-1">
            <IconButton label="Report a bug or idea" onClick={() => setFeedbackOpen(true)}>
              <Bug className="h-5 w-5" />
            </IconButton>
            <NavLink
              to="/settings"
              aria-label="Settings"
              className={({ isActive }) =>
                clsx(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  isActive
                    ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                )
              }
            >
              <Settings className="h-5 w-5" />
            </NavLink>
          </div>
        </div>
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet context={{ openCapture: () => setCaptureOpen(true) } satisfies AppOutletContext} />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="grid grid-cols-5 items-center">
          {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => (
            <NavBarLink key={item.to} item={item} badge={item.to === '/inbox' ? inboxCount : undefined} />
          ))}
          <div />
          {MOBILE_NAV_ITEMS.slice(2).map((item) => (
            <NavBarLink key={item.to} item={item} badge={item.to === '/inbox' ? inboxCount : undefined} />
          ))}
        </div>
      </nav>
      <button
        type="button"
        onClick={() => setCaptureOpen(true)}
        aria-label="New entry"
        className="fixed bottom-6 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg shadow-accent-600/30 transition-transform active:scale-95 md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickCaptureSheet
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        draft={captureDraft}
        onDraftChange={setCaptureDraft}
      />
      <FeedbackSheet
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        draft={feedbackDraft}
        onDraftChange={setFeedbackDraft}
      />
    </div>
  )
}

function NavBarLink({ item, badge }: { item: NavItem; badge?: number }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        clsx(
          'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium',
          isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 dark:text-slate-400',
        )
      }
    >
      <span className="relative">
        <item.icon className="h-5 w-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[9px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {item.label}
    </NavLink>
  )
}
