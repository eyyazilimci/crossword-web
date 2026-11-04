import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { BarChart3, GraduationCap, Library, Moon, Sun, Swords } from 'lucide-react'
import clsx from 'clsx'
import { Toaster } from './Toaster'

function useTheme() {
  const [light, setLight] = useState(() => document.documentElement.classList.contains('light'))
  const toggle = () => {
    const next = !light
    document.documentElement.classList.toggle('light', next)
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark')
    } catch {
      // Storage unavailable (private mode); the toggle still works for this visit.
    }
    setLight(next)
  }
  return { light, toggle }
}

const links = [
  { to: '/', label: 'Oyna', icon: Swords, end: true },
  { to: '/quiz', label: 'Gramer', icon: GraduationCap, end: false },
  { to: '/library', label: 'Kütüphane', icon: Library, end: false },
  { to: '/stats', label: 'İstatistikler', icon: BarChart3, end: false },
]

export function AppShell() {
  const { light, toggle } = useTheme()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-bold tracking-tight">
              Kelime <span className="gradient-text">Çengel</span>
            </span>
          </NavLink>

          <nav className="ml-auto flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                  )
                }
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
            <button
              onClick={toggle}
              className="ml-1 rounded-xl p-2 text-muted transition-colors hover:text-fg"
              aria-label="Temayı değiştir"
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
