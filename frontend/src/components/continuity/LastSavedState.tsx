import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IdeaLastState } from '@/types'
import { Bookmark, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LastSavedStateProps {
  initialState: IdeaLastState | null
  onChange: (state: IdeaLastState) => void
}

export function LastSavedState({
  initialState,
  onChange,
}: LastSavedStateProps) {
  const [state, setState] = useState<IdeaLastState>({
    whereIStopped: '',
    whatIWasDoing: '',
    nextStep: '',
    updatedAt: new Date().toISOString(),
  })

  useEffect(() => {
    if (initialState) {
      setState(initialState)
    }
  }, [initialState])

  const handleChange = (field: keyof IdeaLastState, value: string) => {
    const newState = {
      ...state,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }
    setState(newState)
    onChange(newState)
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Último Estado Salvo</CardTitle>
          </div>
          {initialState?.updatedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(initialState.updatedAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="where-stopped" className="text-primary font-semibold">
            Onde parei
          </Label>
          <Input
            id="where-stopped"
            placeholder="Ex: Finalizei a configuração do banco..."
            value={state.whereIStopped}
            onChange={(e) => handleChange('whereIStopped', e.target.value)}
            className="border-primary/20 focus-visible:ring-primary/30"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="what-doing">O que estava fazendo</Label>
            <Textarea
              id="what-doing"
              placeholder="Contexto da tarefa atual..."
              value={state.whatIWasDoing}
              onChange={(e) => handleChange('whatIWasDoing', e.target.value)}
              className="resize-none h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next-step">Próximo passo objetivo</Label>
            <Textarea
              id="next-step"
              placeholder="Ação imediata ao retomar..."
              value={state.nextStep}
              onChange={(e) => handleChange('nextStep', e.target.value)}
              className="resize-none h-24"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
