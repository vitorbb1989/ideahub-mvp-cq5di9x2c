import { useState, useMemo, useEffect } from 'react'
import { PromptTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Copy, RefreshCw, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { extractPlaceholders, escapeRegExp } from '@/lib/utils'

interface PromptGeneratorToolProps {
  templates: PromptTemplate[]
}

export function PromptGeneratorTool({ templates }: PromptGeneratorToolProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  )

  const placeholders = useMemo(() => {
    if (!selectedTemplate) return []
    return extractPlaceholders(selectedTemplate.content)
  }, [selectedTemplate])

  // Reset inputs when template changes
  useEffect(() => {
    setInputs({})
    setGeneratedPrompt('')
    setError(null)
  }, [selectedTemplateId])

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleGenerate = () => {
    if (!selectedTemplate) return

    // Validation
    const missing = placeholders.filter((key) => !inputs[key]?.trim())
    if (missing.length > 0) {
      setError(
        `Por favor, preencha os campos obrigatórios: ${missing
          .map((m) => `{{${m}}}`)
          .join(', ')}`,
      )
      return
    }

    let result = selectedTemplate.content
    placeholders.forEach((key) => {
      // Create regex for {{ key }} allowing spaces
      const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g')
      result = result.replace(regex, inputs[key])
    })

    setGeneratedPrompt(result)
    toast({
      title: 'Prompt Gerado!',
      description: 'Seu prompt está pronto para uso.',
    })
  }

  const copyToClipboard = () => {
    if (!generatedPrompt) return
    navigator.clipboard.writeText(generatedPrompt)
    toast({
      title: 'Copiado!',
      description: 'Prompt copiado para a área de transferência.',
    })
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>
            Selecione um template e preencha os dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <>
              <div className="space-y-2">
                <Label>Conteúdo do Template</Label>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {selectedTemplate.content}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Variáveis</h4>
                {placeholders.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Este template não possui variáveis dinâmicas.
                  </p>
                ) : (
                  placeholders.map((placeholder) => (
                    <div key={placeholder} className="space-y-1.5">
                      <Label className="break-all">
                        Preencher {`{{${placeholder}}}`}
                      </Label>
                      <Input
                        placeholder={`Digite o valor...`}
                        value={inputs[placeholder] || ''}
                        onChange={(e) =>
                          handleInputChange(placeholder, e.target.value)
                        }
                      />
                    </div>
                  ))
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleGenerate} className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Gerar Prompt
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
          <CardDescription>
            O prompt gerado aparecerá aqui para cópia.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          {generatedPrompt ? (
            <>
              <Textarea
                value={generatedPrompt}
                readOnly
                className="flex-1 min-h-[300px] font-mono text-sm resize-none bg-muted/20"
              />
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar para Transferência
              </Button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
              <RefreshCw className="w-8 h-8 mb-2 opacity-50" />
              <p>Aguardando geração...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
