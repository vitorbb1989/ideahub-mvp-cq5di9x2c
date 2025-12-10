import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { IdeaProvider } from '@/context/IdeaContext'
import { PromptProvider } from '@/context/PromptContext'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  // Determine title based on route
  let title = 'IdeaHub'
  if (location.pathname === '/') title = 'Inbox'
  else if (location.pathname === '/board') title = 'Board de Ideias'
  else if (location.pathname === '/catalog') title = 'Catálogo de Ideias'
  else if (location.pathname === '/profile') title = 'Perfil'
  else if (location.pathname === '/documentation')
    title = 'Documentação Técnica'
  else if (location.pathname === '/prompts/library')
    title = 'Biblioteca de Templates'
  else if (location.pathname === '/prompts/generator') title = 'Gerador IA'

  return (
    <IdeaProvider>
      <PromptProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="flex flex-col flex-1 min-w-0">
            <Header title={title} onMenuClick={() => setIsSidebarOpen(true)} />

            <main className="flex-1 overflow-auto">
              <div className="container p-4 mx-auto max-w-7xl md:p-8 animate-fade-in h-full">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </PromptProvider>
    </IdeaProvider>
  )
}
