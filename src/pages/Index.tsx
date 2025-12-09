import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import { useIdeas } from '@/context/IdeaContext'
import { IdeaModal } from '@/components/IdeaModal'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Quick Capture Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Captura Rápida</h2>
        <Card className="border-2 border-dashed shadow-sm">
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
                          placeholder="Qual é a sua ideia?"
                          className="text-lg font-medium border-0 px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
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
                          placeholder="Adicione um resumo rápido (opcional)"
                          className="min-h-[60px] resize-none border-0 px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="w-full sm:w-auto">
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
          <h2 className="text-xl font-semibold tracking-tight">
            Recentes na Inbox
          </h2>
          <Badge variant="secondary">{inboxIdeas.length}</Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : inboxIdeas.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">
              Sua Inbox está vazia. Capture uma nova ideia acima!
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {inboxIdeas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => openIdea(idea.id)}
                className="group flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 bg-card rounded-lg border shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="space-y-1">
                  <h3 className="font-medium leading-none group-hover:text-primary transition-colors">
                    {idea.title}
                  </h3>
                  {idea.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {idea.summary}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {idea.tags.map((t) => (
                      <span
                        key={t.id}
                        className="bg-secondary px-1.5 rounded text-[10px] text-secondary-foreground"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <StatusBadge status={idea.status} />
                  <span>
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
