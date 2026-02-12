import { Outlet, NavLink, useLocation } from 'react-router'
import { ModeToggle } from '@/features/mode-toggle'

export function Layout() {
  const location = useLocation()
  const isChatRoute = location.pathname === '/'

  if (isChatRoute) {
    return (
      <div className="min-h-screen bg-background font-sans antialiased relative">
        <div className="absolute top-4 right-4 z-50">
          <ModeToggle />
        </div>
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <h1 className="text-xl font-bold">Chatbot RAG</h1>
          </div>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`
              }
            >
              Chat
            </NavLink>
            <NavLink
              to="/documentos"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`
              }
            >
              Documentos
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl py-10 px-4">
        <Outlet />
      </main>
    </div>
  )
}
