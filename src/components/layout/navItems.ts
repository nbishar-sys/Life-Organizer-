import { BookOpen, CalendarCheck, Inbox as InboxIcon, Settings as SettingsIcon } from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/notebook', label: 'Notebook', icon: BookOpen },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]
