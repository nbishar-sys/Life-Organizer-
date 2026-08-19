import {
  BookOpen,
  CalendarCheck,
  FolderKanban,
  Inbox as InboxIcon,
  Settings as SettingsIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

/**
 * Full nav, used by the desktop sidebar (plenty of vertical room for 5).
 * The mobile bottom bar shows only MOBILE_NAV_ITEMS — Settings moves to a
 * header icon there instead, since a 5-icon thumb-width tab bar gets
 * cramped and Settings isn't part of the daily capture/triage loop.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/notebook', label: 'Notebook', icon: BookOpen },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== '/settings')
