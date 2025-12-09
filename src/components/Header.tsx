import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-background/80 backdrop-blur-md border-b shrink-0 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="mr-4 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>
      <h1 className="text-lg font-semibold lg:text-xl">{title}</h1>
    </header>
  )
}
