import { Idea } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PriorityDisplay } from './PriorityDisplay'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface IdeaCardProps {
  idea: Idea
  onClick: () => void
  onDragStart?: (e: React.DragEvent, id: string) => void
  isDraggable?: boolean
}

export function IdeaCard({
  idea,
  onClick,
  onDragStart,
  isDraggable = false,
}: IdeaCardProps) {
  return (
    <Card
      className={cn(
        'group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-l-4',
        // Visual indicator based on priority score for the border
        idea.priorityScore >= 2.5
          ? 'border-l-red-500'
          : idea.priorityScore >= 1
            ? 'border-l-emerald-500'
            : 'border-l-blue-400',
      )}
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStart && onDragStart(e, idea.id)}
    >
      <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
          {idea.title}
        </CardTitle>
        {isDraggable && (
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {idea.summary && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {idea.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {idea.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] h-5"
            >
              {tag.name}
            </Badge>
          ))}
          {idea.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{idea.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <PriorityDisplay
            impact={idea.impact}
            effort={idea.effort}
            className="opacity-80"
          />
        </div>
      </CardContent>
    </Card>
  )
}
