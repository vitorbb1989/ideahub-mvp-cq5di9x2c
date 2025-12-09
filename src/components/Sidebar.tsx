import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Inbox, KanbanSquare, Library, Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    { to: '/', label: 'Inbox', icon: Inbox },
    { to: '/board', label: 'Board', icon: KanbanSquare },
    { to: '/catalog', label: 'Catálogo', icon: Library },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border shadow-xl lg:shadow-none lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Lightbulb className="w-6 h-6 fill-current" />
            <span>IdeaHub</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose()
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary/10 text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} IdeaHub MVP
        </div>
      </aside>
    </>
  )
}
