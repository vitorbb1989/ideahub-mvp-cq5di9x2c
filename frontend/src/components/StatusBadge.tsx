import { Badge } from '@/components/ui/badge'
import { IdeaStatus, STATUS_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: IdeaStatus
  className?: string
}

const statusColors: Record<IdeaStatus, string> = {
  inbox: 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border-zinc-200',
  nova_ideia: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
  em_analise:
    'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200',
  mvp: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
  backlog: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200',
  em_andamento:
    'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200',
  entregue:
    'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
  arquivada: 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal whitespace-nowrap',
        statusColors[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
