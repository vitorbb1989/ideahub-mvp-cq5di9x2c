import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { IdeaChecklistItem } from '@/types'
import { CheckSquare, Plus, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdeaChecklistProps {
  items: IdeaChecklistItem[]
  onAdd: (label: string) => Promise<void>
  onToggle: (id: string, done: boolean) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function IdeaChecklist({
  items,
  onAdd,
  onToggle,
  onRemove,
}: IdeaChecklistProps) {
  const [newItemLabel, setNewItemLabel] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAdd = async () => {
    if (!newItemLabel.trim() || isProcessing) return
    setIsProcessing(true)
    try {
      await onAdd(newItemLabel)
      setNewItemLabel('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggle = async (id: string, currentDone: boolean) => {
    try {
      await onToggle(id, !currentDone)
    } catch (error) {
      console.error('Failed to toggle item', error)
    }
  }

  const handleRemove = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      try {
        await onRemove(id)
      } catch (error) {
        console.error('Failed to remove item', error)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Checklist de Tarefas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar nova tarefa..."
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            disabled={isProcessing}
          />
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={!newItemLabel.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={() => handleToggle(item.id, item.done)}
                  id={`item-${item.id}`}
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={cn(
                    'text-sm cursor-pointer select-none truncate',
                    item.done && 'line-through text-muted-foreground',
                  )}
                >
                  {item.label}
                </label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 italic">
              Nenhuma tarefa pendente.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
