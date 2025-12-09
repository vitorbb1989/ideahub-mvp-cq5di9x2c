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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIdeas } from '@/context/IdeaContext'
import {
  IdeaCategory,
  IdeaStatus,
  STATUS_LABELS,
  CATEGORY_LABELS,
  Tag,
  IdeaEvent,
} from '@/types'
import { X, Calendar, Plus, Check, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const ideaSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  summary: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  category: z.string(),
  impact: z.number().min(1).max(5),
  effort: z.number().min(1).max(5),
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
  const {
    ideas,
    tags: availableTags,
    addIdea,
    updateIdea,
    createTag,
    getEvents,
  } = useIdeas()
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [history, setHistory] = useState<IdeaEvent[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [tagOpen, setTagOpen] = useState(false)

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
    },
  })

  // Load Idea Data
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
        })
        setSelectedTags(existingIdea.tags)
        // Fetch history
        getEvents(existingIdea.id).then(setHistory)
      } else {
        form.reset({
          title: '',
          summary: '',
          description: '',
          status: initialStatus || 'inbox',
          category: 'nova_solucao',
          impact: 3,
          effort: 3,
        })
        setSelectedTags([])
        setHistory([])
      }
    }
  }, [isOpen, existingIdea, form, initialStatus, getEvents])

  const onSubmit = (values: z.infer<typeof ideaSchema>) => {
    const commonData = {
      title: values.title,
      summary: values.summary || '',
      description: values.description || '',
      status: values.status as IdeaStatus,
      category: values.category as IdeaCategory,
      impact: values.impact,
      effort: values.effort,
      tags: selectedTags,
    }

    if (existingIdea) {
      updateIdea(existingIdea.id, commonData)
    } else {
      addIdea(commonData)
    }
    onClose()
  }

  const handleCreateTag = async () => {
    if (!tagSearch.trim()) return
    const newTag = await createTag(tagSearch)
    setSelectedTags([...selectedTags, newTag])
    setTagSearch('')
  }

  const toggleTag = (tag: Tag) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
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
                <div className="flex flex-col gap-2">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag.name} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    <Popover open={tagOpen} onOpenChange={setTagOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar tag..."
                            value={tagSearch}
                            onValueChange={setTagSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={handleCreateTag}
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Criar "{tagSearch}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {availableTags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => {
                                    toggleTag(tag)
                                    setTagOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedTags.some((t) => t.id === tag.id)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {tag.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                    <h3 className="text-sm font-semibold">
                      Histórico de Atividades
                    </h3>
                    <div className="space-y-3 pl-2 border-l-2 border-muted">
                      {history.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-sm relative"
                        >
                          <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-muted-foreground/50" />
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
                              {h.previousStatus ? (
                                <>
                                  Mudou de{' '}
                                  <span className="font-medium">
                                    {STATUS_LABELS[h.previousStatus]}
                                  </span>{' '}
                                  para{' '}
                                  <span className="font-medium text-foreground">
                                    {STATUS_LABELS[h.newStatus]}
                                  </span>
                                </>
                              ) : (
                                <span>
                                  Ideia criada como{' '}
                                  <span className="font-medium text-foreground">
                                    {STATUS_LABELS[h.newStatus]}
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma atividade registrada.
                        </p>
                      )}
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
