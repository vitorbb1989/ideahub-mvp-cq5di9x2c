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
  Settings,
  FileText,
  PlayCircle,
  Wand2,
  BookTemplate,
  Activity,
  Zap,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', label: 'Inbox', icon: Inbox },
    { to: '/resume', label: 'Resume', icon: PlayCircle },
    { to: '/board', label: 'Board', icon: KanbanSquare },
    { to: '/catalog', label: 'Catálogo', icon: Library },
    { to: '/docs', label: 'Docs Hub', icon: FolderOpen },
    { to: '/prompts/generator', label: 'Gerador IA', icon: Wand2 },
    {
      to: '/prompts/library',
      label: 'Templates',
      icon: BookTemplate,
    },
    { to: '/documentation', label: 'Documentação', icon: FileText },
    { to: '/system-health', label: 'System Health', icon: Activity },
    { to: '/load-test', label: 'Load Test', icon: Zap },
    { to: '/profile', label: 'Perfil', icon: Settings },
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
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border shadow-2xl lg:shadow-none lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border shrink-0 bg-sidebar-background">
          <div className="flex items-center gap-3 font-bold text-xl text-primary tracking-tight">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Lightbulb className="w-5 h-5 fill-current" />
            </div>
            <span>IdeaHub</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1',
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-sidebar-border shrink-0 bg-sidebar-background">
          <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
            <Avatar className="h-9 w-9 border-2 border-background">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {user?.name ? (
                  getInitials(user.name)
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors h-9"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da conta
          </Button>
        </div>

        <div className="px-6 py-4 text-center text-[10px] text-muted-foreground border-t border-sidebar-border shrink-0 bg-muted/20">
          <p>IdeaHub MVP v0.0.25</p>
        </div>
      </aside>
    </>
  )
}
