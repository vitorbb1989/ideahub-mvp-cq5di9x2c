import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2, Sparkles, Inbox } from 'lucide-react'
import { useIdeas } from '@/context/IdeaContext'
import { IdeaModal } from '@/components/IdeaModal'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

const quickCaptureSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  summary: z.string().optional(),
})

const Index = () => {
  const { ideas, addIdea, isLoading } = useIdeas()
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const inboxIdeas = ideas.filter((i) => i.status === 'inbox')

  const form = useForm<z.infer<typeof quickCaptureSchema>>({
    resolver: zodResolver(quickCaptureSchema),
    defaultValues: {
      title: '',
      summary: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof quickCaptureSchema>) => {
    await addIdea({
      title: values.title,
      summary: values.summary || '',
      status: 'inbox',
      category: 'nova_solucao',
      impact: 3,
      effort: 3,
      tags: [],
    })
    form.reset()
  }

  const openIdea = (id: string) => {
    setSelectedIdeaId(id)
    setIsModalOpen(true)
  }

  const closeIdea = () => {
    setIsModalOpen(false)
    setSelectedIdeaId(null)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Quick Capture Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Captura Rápida</h2>
        </div>
        <Card className="border shadow-sm overflow-hidden bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle className="text-base font-medium">
              O que você está pensando?
            </CardTitle>
            <CardDescription>
              Registre sua ideia antes que ela escape.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Título da sua ideia brilhante..."
                          className="text-lg font-medium h-12 px-4 shadow-sm focus-visible:ring-primary/20"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione um resumo ou contexto rápido (opcional)..."
                          className="min-h-[80px] resize-none shadow-sm focus-visible:ring-primary/20 text-sm leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Salvar na Inbox
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {/* Recent Inbox Ideas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">
              Recentes na Inbox
            </h2>
          </div>
          <Badge variant="outline" className="px-2 py-0.5 h-6 text-sm">
            {inboxIdeas.length} {inboxIdeas.length === 1 ? 'item' : 'itens'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : inboxIdeas.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="w-6 h-6 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="font-medium text-foreground">
              Sua Inbox está vazia
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Capture uma nova ideia acima para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {inboxIdeas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => openIdea(idea.id)}
                className="group flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 bg-card rounded-lg border shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-muted/5 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="space-y-1.5 relative z-10 flex-1 min-w-0">
                  <h3 className="font-semibold leading-none group-hover:text-primary transition-colors truncate">
                    {idea.title}
                  </h3>
                  {idea.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-1 pr-4">
                      {idea.summary}
                    </p>
                  )}
                </div>
                <div className="relative z-10 flex items-center gap-4 text-xs text-muted-foreground shrink-0 mt-2 sm:mt-0">
                  {idea.tags.length > 0 && (
                    <div className="hidden md:flex gap-1">
                      {idea.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-secondary-foreground font-medium"
                        >
                          {t.name}
                        </span>
                      ))}
                      {idea.tags.length > 3 && (
                        <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] text-secondary-foreground">
                          +{idea.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <StatusBadge status={idea.status} className="shadow-none" />
                  <span className="tabular-nums">
                    {formatDistanceToNow(new Date(idea.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Idea Modal */}
      <IdeaModal
        isOpen={isModalOpen}
        onClose={closeIdea}
        ideaId={selectedIdeaId}
      />
    </div>
  )
}

export default Index
