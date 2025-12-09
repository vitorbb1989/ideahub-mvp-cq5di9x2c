import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useIdeas } from '@/context/IdeaContext'
import {
  Idea,
  IdeaCategory,
  IdeaStatus,
  STATUS_LABELS,
  CATEGORY_LABELS,
} from '@/types'
import { X, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ideaSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  summary: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  category: z.string(),
  impact: z.number().min(1).max(5),
  effort: z.number().min(1).max(5),
  tags: z.string().optional(), // We'll handle tag string to array conversion manually
})

interface IdeaModalProps {
  ideaId?: string | null
  initialStatus?: IdeaStatus
  isOpen: boolean
  onClose: () => void
}

export function IdeaModal({
  ideaId,
  initialStatus,
  isOpen,
  onClose,
}: IdeaModalProps) {
  const { ideas, addIdea, updateIdea } = useIdeas()
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const existingIdea = ideaId ? ideas.find((i) => i.id === ideaId) : null

  const form = useForm<z.infer<typeof ideaSchema>>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      status: initialStatus || 'inbox',
      category: 'nova_solucao',
      impact: 3,
      effort: 3,
      tags: '',
    },
  })

  // Reset or fill form when opening
  useEffect(() => {
    if (isOpen) {
      if (existingIdea) {
        form.reset({
          title: existingIdea.title,
          summary: existingIdea.summary || '',
          description: existingIdea.description || '',
          status: existingIdea.status,
          category: existingIdea.category,
          impact: existingIdea.impact,
          effort: existingIdea.effort,
          tags: '',
        })
        setTags(existingIdea.tags)
      } else {
        form.reset({
          title: '',
          summary: '',
          description: '',
          status: initialStatus || 'inbox',
          category: 'nova_solucao',
          impact: 3,
          effort: 3,
          tags: '',
        })
        setTags([])
      }
    }
  }, [isOpen, existingIdea, form, initialStatus])

  const onSubmit = (values: z.infer<typeof ideaSchema>) => {
    const commonData = {
      title: values.title,
      summary: values.summary,
      description: values.description,
      status: values.status as IdeaStatus,
      category: values.category as IdeaCategory,
      impact: values.impact,
      effort: values.effort,
      tags: tags,
    }

    if (existingIdea) {
      updateIdea(existingIdea.id, commonData)
    } else {
      addIdea(commonData)
    }
    onClose()
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = tagInput.trim()
      if (val && !tags.includes(val)) {
        setTags([...tags, val])
        setTagInput('')
      }
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const impactValue = form.watch('impact')
  const effortValue = form.watch('effort')
  const priorityScore = (impactValue / effortValue).toFixed(2)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
          <DialogTitle>
            {existingIdea ? 'Editar Ideia' : 'Nova Ideia'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <ScrollArea className="flex-1 p-6">
              <div className="grid gap-6">
                {/* Basic Info */}
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Integração com Slack"
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
                        <FormLabel>Resumo</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Uma breve descrição da ideia..."
                            className="resize-none h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status & Category */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORY_LABELS).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Priority */}
                <div className="p-4 border rounded-md bg-muted/10 grid gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Priorização</h3>
                    <div className="text-sm font-medium">
                      Score:{' '}
                      <span className="text-primary">{priorityScore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between mb-2">
                            <FormLabel>Impacto</FormLabel>
                            <span className="text-xs text-muted-foreground">
                              {field.value} / 5
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effort"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between mb-2">
                            <FormLabel>Esforço</FormLabel>
                            <span className="text-xs text-muted-foreground">
                              {field.value} / 5
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md min-h-[42px] bg-background">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    <input
                      className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px]"
                      placeholder={
                        tags.length === 0 ? 'Digite e pressione Enter...' : ''
                      }
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                  </div>
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Detalhada</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes completos sobre a ideia..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* History Log - Only if existing idea */}
                {existingIdea && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-sm font-semibold">Histórico</h3>
                    <div className="space-y-3">
                      {existingIdea.history.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div className="grid gap-0.5">
                            <p className="text-muted-foreground text-xs">
                              {format(
                                new Date(h.date),
                                "dd 'de' MMMM 'às' HH:mm",
                                {
                                  locale: ptBR,
                                },
                              )}
                            </p>
                            <p>
                              Mudou de{' '}
                              <span className="font-medium">
                                {h.previousStatus
                                  ? STATUS_LABELS[h.previousStatus]
                                  : 'Criação'}
                              </span>{' '}
                              para{' '}
                              <span className="font-medium text-foreground">
                                {STATUS_LABELS[h.newStatus]}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-start gap-3 text-sm">
                        <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="grid gap-0.5">
                          <p className="text-muted-foreground text-xs">
                            {format(
                              new Date(existingIdea.createdAt),
                              "dd 'de' MMMM 'às' HH:mm",
                              { locale: ptBR },
                            )}
                          </p>
                          <p>Ideia criada</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
