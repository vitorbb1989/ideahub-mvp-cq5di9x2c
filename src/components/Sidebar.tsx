import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Inbox,
  KanbanSquare,
  Library,
  Lightbulb,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', label: 'Inbox', icon: Inbox },
    { to: '/board', label: 'Board', icon: KanbanSquare },
    { to: '/catalog', label: 'Catálogo', icon: Library },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

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
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border shadow-xl lg:shadow-none lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border shrink-0">
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

        {/* User Profile Section */}
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-md bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user?.name ? getInitials(user.name) : <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-sidebar-border shrink-0">
          © {new Date().getFullYear()} IdeaHub MVP
        </div>
      </aside>
    </>
  )
}
