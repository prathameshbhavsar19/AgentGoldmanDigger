import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '../brand/Logo'
import { copy } from '../../lib/copy'

interface AppShellProps { children: ReactNode }

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  const isCanvas = pathname.startsWith('/canvas')

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top navigation — hidden on canvas (canvas has its own top bar) */}
      {!isCanvas && (
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-bg-elev/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
            <Link to="/" aria-label="Portfolio GPS home">
              <Logo size="sm" />
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-4 list-none m-0 p-0">
                <li>
                  <Link
                    to="/onboarding"
                    className="text-sm font-medium text-ink-muted hover:text-ink transition-colors duration-150"
                  >
                    Start
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer — hidden on canvas */}
      {!isCanvas && (
        <footer className="border-t border-[var(--border)] bg-bg-elev/80">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <Logo size="sm" />
            <p className="text-xs text-ink-faint text-center max-w-xl">
              {copy.disclaimer}
            </p>
            <p className="text-xs text-ink-faint">&copy; {new Date().getFullYear()} Portfolio GPS</p>
          </div>
        </footer>
      )}
    </div>
  )
}
export default AppShell
