import { IdeaTimelineEvent } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Circle, CheckCircle2, FileText, Camera } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface IdeaTimelineProps {
  events: IdeaTimelineEvent[]
}

const getIcon = (type: string) => {
  switch (type) {
    case 'snapshot_created':
      return <Camera className="w-4 h-4 text-purple-500" />
    case 'last_state_updated':
      return <FileText className="w-4 h-4 text-blue-500" />
    case 'checklist_updated':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'references_updated':
      return <Activity className="w-4 h-4 text-orange-500" />
    default:
      return <Circle className="w-4 h-4 text-gray-500" />
  }
}

const getLabel = (type: string) => {
  switch (type) {
    case 'snapshot_created':
      return 'Snapshot Criado'
    case 'last_state_updated':
      return 'Estado Salvo'
    case 'checklist_updated':
      return 'Checklist Atualizado'
    case 'references_updated':
      return 'Referências Atualizadas'
    case 'status_changed':
      return 'Status Alterado'
    case 'priority_updated':
      return 'Prioridade Atualizada'
    default:
      return 'Evento Registrado'
  }
}

export function IdeaTimeline({ events }: IdeaTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Linha do Tempo</h3>
      </div>

      <div className="relative pl-4 border-l-2 border-muted space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative pl-6">
            <div className="absolute -left-[9px] top-0 bg-background p-1 rounded-full border border-muted">
              {getIcon(event.type)}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {getLabel(event.type)}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.createdAt), "dd 'de' MMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground italic pl-6">
            Nenhum evento registrado.
          </p>
        )}
      </div>
    </div>
  )
}
