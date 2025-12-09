import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface PriorityDisplayProps {
  impact: number
  effort: number
  showLabel?: boolean
  className?: string
}

export function PriorityDisplay({
  impact,
  effort,
  showLabel = false,
  className,
}: PriorityDisplayProps) {
  const score = impact / effort

  let colorClass = 'text-blue-400'
  if (score >= 2.5)
    colorClass = 'text-red-500' // High impact, Low effort
  else if (score >= 1) colorClass = 'text-emerald-500' // Balanced

  // Generate stars based on priority score roughly mapped to 1-5 visual
  // Score range: 0.2 to 5.
  const starCount = Math.min(Math.max(Math.round(score), 1), 5)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-3 h-3',
              i < starCount ? colorClass : 'text-slate-200',
              i < starCount && 'fill-current',
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground ml-1">
          ({score.toFixed(1)})
        </span>
      )}
    </div>
  )
}
