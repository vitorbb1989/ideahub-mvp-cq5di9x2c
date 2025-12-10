import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { PromptTemplate } from '@/types'
import { Loader2, Plus, Hash } from 'lucide-react'
import { extractPlaceholders } from '@/lib/utils'

const templateSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  content: z.string().min(1, 'O conteúdo do template é obrigatório'),
})

interface PromptTemplateModalProps {
  template?: PromptTemplate | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: { title: string; content: string }) => Promise<void>
}

export function PromptTemplateModal({
  template,
  isOpen,
  onClose,
  onSave,
}: PromptTemplateModalProps) {
  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const content = form.watch('content')

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: template?.title || '',
        content: template?.content || '',
      })
    }
  }, [isOpen, template, form])

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    await onSave(values)
    onClose()
  }

  const placeholders = extractPlaceholders(content)

  const getNextPlaceholderNumber = (text: string): number => {
    if (!text) return 1
    const regex = /\{\{\s*(\d+)\s*\}\}/g
    const matches = [...text.matchAll(regex)]
    const numbers = matches.map((m) => parseInt(m[1], 10))

    if (numbers.length === 0) return 1
    return Math.max(...numbers) + 1
  }

  const handleInsertPlaceholder = () => {
    const currentContent = form.getValues('content') || ''
    const nextNumber = getNextPlaceholderNumber(currentContent)

    const placeholder = `{{${nextNumber}}}`
    const textarea = textareaRef.current

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const newValue =
        currentContent.substring(0, start) +
        placeholder +
        currentContent.substring(end)

      form.setValue('content', newValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })

      // Restore focus and move cursor after the inserted placeholder
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + placeholder.length,
          start + placeholder.length,
        )
      }, 0)
    } else {
      const newValue = currentContent + placeholder
      form.setValue('content', newValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template de Prompt'}
          </DialogTitle>
          <DialogDescription>
            Defina placeholders sequenciais (ex: {'{{1}}'}) para preenchimento
            automático ou use chaves duplas para variáveis nomeadas (ex:{' '}
            {'{{tópico}}'}).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gerador de Ideias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Conteúdo do Template</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleInsertPlaceholder}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Inserir Placeholder
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Crie 5 ideias sobre {{1}} para o público {{2}}..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                      ref={(e) => {
                        field.ref(e)
                        textareaRef.current = e
                      }}
                    />
                  </FormControl>

                  {/* Dynamic Placeholder Summary */}
                  <div className="min-h-[20px]">
                    {placeholders.length > 0 && (
                      <div className="rounded-md bg-muted/50 p-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 font-medium text-foreground/80 mb-1">
                          <Hash className="w-4 h-4" />
                          <span>
                            Total: {placeholders.length} campos identificados
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6 break-all">
                          Variáveis:{' '}
                          {placeholders.map((p) => `{{${p}}}`).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Template
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
