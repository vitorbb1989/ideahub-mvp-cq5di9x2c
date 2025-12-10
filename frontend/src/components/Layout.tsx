import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { IdeaProvider } from '@/context/IdeaContext'
import { PromptProvider } from '@/context/PromptContext'
import { DocsProvider } from '@/context/DocsContext'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  // Determine title based on route
  let title = 'IdeaHub'
  if (location.pathname === '/') title = 'Inbox'
  else if (location.pathname === '/board') title = 'Board de Ideias'
  else if (location.pathname === '/catalog') title = 'Catálogo de Ideias'
  else if (location.pathname === '/profile') title = 'Perfil'
  else if (location.pathname === '/docs') title = 'Docs Hub'
  else if (location.pathname === '/documentation')
    title = 'Documentação Técnica'
  else if (location.pathname === '/prompts/library')
    title = 'Biblioteca de Templates'
  else if (location.pathname === '/prompts/generator') title = 'Gerador IA'

  return (
    <IdeaProvider>
      <PromptProvider>
        <DocsProvider>
          <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex flex-col flex-1 min-w-0 h-full relative">
              <Header
                title={title}
                onMenuClick={() => setIsSidebarOpen(true)}
              />

              <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/10 scroll-smooth">
                <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8 animate-fade-in min-h-full">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        </DocsProvider>
      </PromptProvider>
    </IdeaProvider>
  )
}
