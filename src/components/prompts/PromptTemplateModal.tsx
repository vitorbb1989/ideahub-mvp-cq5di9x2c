import { useEffect } from 'react'
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
import { Loader2 } from 'lucide-react'

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template de Prompt'}
          </DialogTitle>
          <DialogDescription>
            Defina placeholders usando chaves duplas, ex: {'{{tópico}}'} ou{' '}
            {'{{palavra_chave}}'}.
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
                  <FormLabel>Conteúdo do Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Crie 5 ideias de marketing sobre {{tópico}} para o público {{público}}..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
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
