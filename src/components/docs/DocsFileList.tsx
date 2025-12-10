import { DocFile, DocFolder } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Plus, File, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getSnippet } from './docsUtils'
import { cn } from '@/lib/utils'

interface DocsFileListProps {
  files: DocFile[]
  currentFolder: DocFolder | undefined
  searchQuery: string
  onSelectFile: (id: string) => void
  isCreating: boolean
  onStartCreate: () => void
  onCancelCreate: () => void
  onCreate: () => void
  newFileName: string
  setNewFileName: (name: string) => void
}

export function DocsFileList({
  files,
  currentFolder,
  searchQuery,
  onSelectFile,
  isCreating,
  onStartCreate,
  onCancelCreate,
  onCreate,
  newFileName,
  setNewFileName,
}: DocsFileListProps) {
  const isSearching = !!searchQuery.trim()

  return (
    <div className="flex flex-col h-full bg-muted/5">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            {isSearching ? (
              <>
                <h2 className="text-2xl font-bold tracking-tight">
                  Resultados da Busca
                </h2>
                <p className="text-muted-foreground">
                  "{searchQuery}" - {files.length} documentos encontrados
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight">
                  {currentFolder ? currentFolder.name : 'Documentos'}
                </h2>
                <p className="text-muted-foreground">
                  {files.length} documentos nesta pasta
                </p>
              </>
            )}
          </div>
          {!isSearching && (
            <div className="flex gap-2">
              {isCreating ? (
                <div className="flex gap-2 animate-in slide-in-from-right-4">
                  <Input
                    placeholder="Nome do arquivo..."
                    className="w-48"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                    autoFocus
                  />
                  <Button onClick={onCreate}>Criar</Button>
                  <Button variant="ghost" onClick={onCancelCreate}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button onClick={onStartCreate}>
                  <Plus className="w-4 h-4 mr-2" /> Novo Documento
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
            {isSearching ? (
              <>
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Nenhum resultado</p>
                <p className="text-sm">Tente outros termos.</p>
              </>
            ) : (
              <>
                <File className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Pasta vazia</p>
                <p className="text-sm">
                  Crie um novo documento ou arraste arquivos para importar.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className="group flex flex-col justify-between p-4 rounded-lg border bg-card shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold truncate mb-1 group-hover:text-primary transition-colors">
                    {file.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Atualizado{' '}
                    {formatDistanceToNow(new Date(file.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                  {isSearching && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded line-clamp-3 font-mono">
                      {getSnippet(file.content, searchQuery)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
