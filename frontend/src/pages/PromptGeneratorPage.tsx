import { usePrompts } from '@/context/PromptContext'
import { PromptGeneratorTool } from '@/components/prompts/PromptGeneratorTool'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PromptGeneratorPage() {
  const { templates, isLoading } = usePrompts()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/prompts/library')}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Biblioteca
        </Button>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Gerador de Prompts
          </h2>
          <p className="text-muted-foreground">
            Selecione um template e preencha as variáveis para gerar seu prompt
            final.
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/10">
          <p className="text-muted-foreground mb-4">
            Você ainda não possui templates cadastrados.
          </p>
          <Button onClick={() => navigate('/prompts/library')}>
            Criar meu primeiro template
          </Button>
        </div>
      ) : (
        <PromptGeneratorTool templates={templates} />
      )}
    </div>
  )
}
