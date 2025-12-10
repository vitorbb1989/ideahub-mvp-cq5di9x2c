import { useState, useEffect } from 'react'
import { DocVersion } from '@/types'
import { useDocs } from '@/context/DocsContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownEditor } from '@/components/docs/MarkdownEditor'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface VersionHistoryProps {
  docId: string
  isOpen: boolean
  onClose: () => void
}

export function VersionHistory({
  docId,
  isOpen,
  onClose,
}: VersionHistoryProps) {
  const { listVersions, restoreVersion } = useDocs()
  const [versions, setVersions] = useState<DocVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<DocVersion | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && docId) {
      loadVersions()
    }
  }, [isOpen, docId])

  const loadVersions = async () => {
    setIsLoading(true)
    try {
      const data = await listVersions(docId)
      setVersions(data)
      if (data.length > 0) setSelectedVersion(data[0])
    } catch (error) {
      console.error(error)
      toast({ variant: 'destructive', title: 'Erro ao carregar histórico' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedVersion) return
    if (
      !confirm(
        'Tem certeza? O conteúdo atual será substituído por esta versão.',
      )
    )
      return

    setIsRestoring(true)
    try {
      await restoreVersion(docId, selectedVersion.id)
      toast({ title: 'Versão restaurada com sucesso' })
      onClose()
    } catch (error) {
      console.error(error)
      toast({ variant: 'destructive', title: 'Erro ao restaurar versão' })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Versões
          </DialogTitle>
          <DialogDescription>
            Visualize e restaure versões anteriores deste documento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar List */}
          <div className="w-64 border-r bg-muted/10 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="flex flex-col p-2 gap-1">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    Nenhuma versão encontrada.
                  </div>
                ) : (
                  versions.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersion(v)}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-md text-left transition-colors text-sm hover:bg-accent',
                        selectedVersion?.id === v.id
                          ? 'bg-accent shadow-sm ring-1 ring-border'
                          : 'transparent',
                      )}
                    >
                      <div className="font-medium truncate w-full">
                        {v.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(v.createdAt), 'dd MMM HH:mm', {
                          locale: ptBR,
                        })}
                      </div>
                      {i === 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                          Atual
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto">
                  <MarkdownEditor
                    content={selectedVersion.content}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione uma versão para visualizar
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/5 shrink-0 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedVersion && (
              <>
                Visualizando:{' '}
                <b>
                  {format(
                    new Date(selectedVersion.createdAt),
                    "dd 'de' MMMM 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </b>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={handleRestore}
              disabled={
                isRestoring ||
                !selectedVersion ||
                (versions.length > 0 && selectedVersion.id === versions[0].id)
              }
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Restaurar Versão
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
