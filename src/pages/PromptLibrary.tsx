import { useState } from 'react'
import { usePrompts } from '@/context/PromptContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Edit2, Trash2, FileText, Loader2 } from 'lucide-react'
import { PromptTemplateModal } from '@/components/prompts/PromptTemplateModal'
import { PromptTemplate } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useNavigate } from 'react-router-dom'

export default function PromptLibrary() {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } =
    usePrompts()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(
    null,
  )
  const navigate = useNavigate()

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: { title: string; content: string }) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data)
    } else {
      await addTemplate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Biblioteca de Templates
          </h2>
          <p className="text-muted-foreground">
            Gerencie seus templates de prompt reutilizáveis.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/prompts/generator')}
          >
            Ir para o Gerador
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/10">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">Sua biblioteca está vazia</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
            Crie seu primeiro template de prompt para agilizar seu trabalho com
            IA.
          </p>
          <Button onClick={handleCreate}>Criar Template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1">{template.title}</CardTitle>
                <CardDescription className="text-xs">
                  Atualizado{' '}
                  {formatDistanceToNow(new Date(template.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 font-mono bg-muted/50 p-2 rounded">
                  {template.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir "{template.title}"? Esta
                        ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTemplate(template.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <PromptTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
        onSave={handleSave}
      />
    </div>
  )
}
