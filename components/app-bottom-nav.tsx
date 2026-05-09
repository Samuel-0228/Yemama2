'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, CalendarDays, Home, User } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/assistant', label: 'AI', icon: Bot },
  { href: '/profile', label: 'Profile', icon: User },
]

export function AppBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-2 py-2">
        {links.map((link) => {
          const active = pathname === link.href
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
