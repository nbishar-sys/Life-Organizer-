import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AppLockProvider, useAppLock } from './context/AppLockContext'
import { AppShell } from './components/layout/AppShell'
import { LockScreen } from './components/lock/LockScreen'
import { TodayPage } from './features/today/TodayPage'
import { NotebookPage } from './features/notebook/NotebookPage'
import { InboxPage } from './features/inbox/InboxPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { ensureDefaultTags } from './data/repository'

function Gated() {
  const { unlocked } = useAppLock()
  if (!unlocked) return <LockScreen />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="notebook" element={<NotebookPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  // Cheap and idempotent — safe to call on every app start.
  useEffect(() => {
    void ensureDefaultTags()
  }, [])

  return (
    <ThemeProvider>
      <AppLockProvider>
        <ToastProvider>
          <HashRouter>
            <Gated />
          </HashRouter>
        </ToastProvider>
      </AppLockProvider>
    </ThemeProvider>
  )
}
