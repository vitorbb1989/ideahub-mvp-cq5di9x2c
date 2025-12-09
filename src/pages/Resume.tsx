import { useIdeas } from '@/context/IdeaContext'
import { Idea } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { PlayCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Resume() {
  const { ideas, isLoading } = useIdeas()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Logic for Lists
  const lastUpdated = [...ideas]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5)

  const inProgress = ideas.filter((i) =>
    ['em_andamento', 'mvp', 'em_analise'].includes(i.status),
  )

  const staleIdeas = ideas.filter((i) => {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(i.updatedAt))
    return daysSinceUpdate >= 30
  })

  const goToIdea = (id: string) => {
    navigate(`/ideas/${id}#last-saved-state`)
  }

  const IdeaList = ({
    ideas,
    emptyMessage,
  }: {
    ideas: Idea[]
    emptyMessage: string
  }) => (
    <div className="space-y-3">
      {ideas.length === 0 ? (
        <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-md bg-muted/10">
          {emptyMessage}
        </div>
      ) : (
        ideas.map((idea) => (
          <div
            key={idea.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate">{idea.title}</h4>
                <StatusBadge
                  status={idea.status}
                  className="scale-75 origin-left"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  Atualizado{' '}
                  {formatDistanceToNow(new Date(idea.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => goToIdea(idea.id)}
            >
              <PlayCircle className="w-4 h-4" />
              Resume
            </Button>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Continuar Trabalho
        </h1>
        <p className="text-muted-foreground">
          Retome suas atividades de onde parou e mantenha o fluxo.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Last Updated */}
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Últimas Atualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IdeaList
              ideas={lastUpdated}
              emptyMessage="Nenhuma ideia atualizada recentemente."
            />
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-blue-500" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IdeaList
              ideas={inProgress}
              emptyMessage="Nenhuma ideia em andamento no momento."
            />
          </CardContent>
        </Card>

        {/* Stale */}
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Sem Atualização (30+ dias)
              </CardTitle>
              {staleIdeas.length > 0 && (
                <Badge variant="secondary">{staleIdeas.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <IdeaList
              ideas={staleIdeas}
              emptyMessage="Todas as suas ideias estão atualizadas!"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
