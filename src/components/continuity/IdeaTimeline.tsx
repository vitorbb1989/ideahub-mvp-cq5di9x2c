import { IdeaTimelineEvent, STATUS_LABELS } from '@/types'
import {
  Activity,
  Circle,
  CheckCircle2,
  FileText,
  Camera,
  Tag,
  ArrowRight,
  ListTodo,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

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
      return <ListTodo className="w-4 h-4 text-green-500" />
    case 'references_updated':
      return <LinkIcon className="w-4 h-4 text-orange-500" />
    case 'status_changed':
      return <Activity className="w-4 h-4 text-indigo-500" />
    case 'priority_updated':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'tags_updated':
      return <Tag className="w-4 h-4 text-teal-500" />
    default:
      return <Circle className="w-4 h-4 text-gray-500" />
  }
}

const getTitle = (type: string) => {
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
    case 'tags_updated':
      return 'Tags Atualizadas'
    default:
      return 'Evento Registrado'
  }
}

const LastStateChanges = ({
  changes,
}: {
  changes: Array<{ field: string; oldValue: string; newValue: string }>
}) => {
  const fieldLabels: Record<string, string> = {
    whereIStopped: 'Onde parei',
    whatIWasDoing: 'O que eu estava fazendo',
    nextStep: 'Próximo passo objetivo',
  }

  return (
    <div className="space-y-2 mt-1">
      {changes.map((change, i) => (
        <div key={i} className="text-xs bg-muted/40 p-2 rounded border">
          <p className="font-semibold mb-1">
            {fieldLabels[change.field] || change.field}
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-muted-foreground">
            <span className="truncate" title={change.oldValue}>
              {change.oldValue || '(vazio)'}
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-foreground truncate" title={change.newValue}>
              {change.newValue || '(vazio)'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

const ChecklistChanges = ({
  added,
  removed,
  updated,
}: {
  added: any[]
  removed: any[]
  updated: any[]
}) => (
  <div className="space-y-1 mt-1 text-xs">
    {added.map((item: any, i: number) => (
      <div key={`add-${i}`} className="flex items-center gap-1 text-green-600">
        <span className="font-semibold">+</span> Item adicionado: "{item.label}"
      </div>
    ))}
    {removed.map((item: any, i: number) => (
      <div key={`rem-${i}`} className="flex items-center gap-1 text-red-600">
        <span className="font-semibold">-</span> Item removido: "{item.label}"
      </div>
    ))}
    {updated.map((item: any, i: number) => (
      <div key={`upd-${i}`} className="text-muted-foreground">
        <span className="text-blue-500 font-semibold">•</span>
        {item.change === 'status' ? (
          <>
            Item "{item.label}" marcado como{' '}
            <span className="font-medium text-foreground">
              {item.newValue ? 'concluído' : 'pendente'}
            </span>
          </>
        ) : (
          <>
            Item renomeado de "{item.oldValue}" para "{item.newValue}"
          </>
        )}
      </div>
    ))}
  </div>
)

const ReferencesChanges = ({
  added,
  removed,
  updated,
}: {
  added: any[]
  removed: any[]
  updated: any[]
}) => (
  <div className="space-y-1 mt-1 text-xs">
    {added.map((item: any, i: number) => (
      <div key={`add-${i}`} className="flex items-center gap-1 text-green-600">
        <span className="font-semibold">+</span> Link adicionado: "{item.title}"
      </div>
    ))}
    {removed.map((item: any, i: number) => (
      <div key={`rem-${i}`} className="flex items-center gap-1 text-red-600">
        <span className="font-semibold">-</span> Link removido: "{item.title}"
      </div>
    ))}
    {updated.map((item: any, i: number) => (
      <div key={`upd-${i}`} className="text-muted-foreground">
        <span className="text-blue-500 font-semibold">•</span>
        {item.change === 'both'
          ? `Link "${item.oldTitle}" atualizado para "${item.newTitle}"`
          : item.change === 'title'
            ? `Link "${item.oldTitle}" renomeado para "${item.newTitle}"`
            : `URL do link "${item.title}" atualizada`}
      </div>
    ))}
  </div>
)

export function IdeaTimeline({ events }: IdeaTimelineProps) {
  const renderPayload = (event: IdeaTimelineEvent) => {
    if (!event.payload) return null

    switch (event.type) {
      case 'last_state_updated':
        if (event.payload.changes) {
          return <LastStateChanges changes={event.payload.changes} />
        }
        break
      case 'checklist_updated':
        return (
          <ChecklistChanges
            added={event.payload.added || []}
            removed={event.payload.removed || []}
            updated={event.payload.updated || []}
          />
        )
      case 'references_updated':
        return (
          <ReferencesChanges
            added={event.payload.added || []}
            removed={event.payload.removed || []}
            updated={event.payload.updated || []}
          />
        )
      case 'status_changed':
        return (
          <div className="flex items-center gap-2 mt-1 text-xs">
            <Badge variant="outline" className="text-muted-foreground">
              {STATUS_LABELS[
                event.payload.oldStatus as keyof typeof STATUS_LABELS
              ] || 'Novo'}
            </Badge>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <Badge variant="secondary">
              {
                STATUS_LABELS[
                  event.payload.newStatus as keyof typeof STATUS_LABELS
                ]
              }
            </Badge>
          </div>
        )
      case 'priority_updated':
        return (
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-muted-foreground">
              Score: {event.payload.oldPriority}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-bold text-foreground">
              Score: {event.payload.newPriority}
            </span>
          </div>
        )
      case 'tags_updated':
        return (
          <div className="space-y-1 mt-1 text-xs">
            {event.payload.added?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-green-600 font-semibold">+</span>
                {event.payload.added.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="h-5 px-1 text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {event.payload.removed?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-red-600 font-semibold">-</span>
                {event.payload.removed.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="h-5 px-1 text-[10px] line-through opacity-70"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      case 'snapshot_created':
        return event.payload.snapshotId ? (
          <p className="text-xs text-muted-foreground mt-1">
            ID: {event.payload.snapshotId}
          </p>
        ) : null
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Linha do Tempo</h3>
      </div>

      <div className="relative pl-4 border-l-2 border-muted space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative pl-6 pb-2">
            <div className="absolute -left-[9px] top-0 bg-background p-1 rounded-full border border-muted z-10">
              {getIcon(event.type)}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {getTitle(event.type)}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.createdAt), "dd 'de' MMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
              {renderPayload(event)}
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
