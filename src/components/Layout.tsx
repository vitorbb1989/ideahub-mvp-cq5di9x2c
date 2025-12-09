import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { IdeaProvider } from '@/context/IdeaContext'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  // Determine title based on route
  let title = 'IdeaHub'
  if (location.pathname === '/') title = 'Inbox'
  else if (location.pathname === '/board') title = 'Board de Ideias'
  else if (location.pathname === '/catalog') title = 'Catálogo de Ideias'

  return (
    <IdeaProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <Header title={title} onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="flex-1 overflow-auto">
            <div className="container p-4 mx-auto max-w-7xl md:p-8 animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </IdeaProvider>
  )
}
