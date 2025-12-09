import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { IdeaChecklistItem } from '@/types'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdeaChecklistProps {
  initialItems: IdeaChecklistItem[]
  onChange: (items: IdeaChecklistItem[]) => void
}

export function IdeaChecklist({ initialItems, onChange }: IdeaChecklistProps) {
  const [items, setItems] = useState<IdeaChecklistItem[]>([])
  const [newItemLabel, setNewItemLabel] = useState('')

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const addItem = () => {
    if (!newItemLabel.trim()) return
    const newItem: IdeaChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      label: newItemLabel,
      done: false,
    }
    const updatedItems = [...items, newItem]
    setItems(updatedItems)
    onChange(updatedItems)
    setNewItemLabel('')
  }

  const toggleItem = (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    )
    setItems(updatedItems)
    onChange(updatedItems)
  }

  const removeItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
    onChange(updatedItems)
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
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <Button size="icon" onClick={addItem} disabled={!newItemLabel.trim()}>
            <Plus className="w-4 h-4" />
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
                  onCheckedChange={() => toggleItem(item.id)}
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
                onClick={() => removeItem(item.id)}
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
