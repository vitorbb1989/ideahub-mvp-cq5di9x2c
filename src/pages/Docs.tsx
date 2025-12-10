import { useState, useRef } from 'react'
import { FolderTree } from '@/components/docs/FolderTree'
import { MarkdownEditor } from '@/components/docs/MarkdownEditor'
import { ImportModal } from '@/components/docs/ImportModal'
import { useDocs } from '@/context/DocsContext'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  FileText,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Loader2,
  File,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Docs() {
  const { folders, files, createFile, updateFile, deleteFile, isLoading } =
    useDocs()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [isEditingFile, setIsEditingFile] = useState(false)

  // Create File State
  const [newFileName, setNewFileName] = useState('')
  const [isCreatingFile, setIsCreatingFile] = useState(false)

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  const dragCounter = useRef(0)

  const selectedFile = files.find((f) => f.id === selectedFileId)
  const folderFiles = files.filter((f) => f.folderId === selectedFolderId)
  const currentFolder = folders.find((f) => f.id === selectedFolderId)

  // Drag Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const mdFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.endsWith('.md'),
      )
      if (mdFiles.length > 0) {
        setDroppedFiles(mdFiles)
        setIsImportOpen(true)
      }
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return
    await createFile(newFileName, '', selectedFolderId)
    setNewFileName('')
    setIsCreatingFile(false)
  }

  const handleSaveContent = async (content: string) => {
    if (selectedFile) {
      await updateFile(selectedFile.id, { content })
    }
  }

  const handleRenameFile = async (name: string) => {
    if (selectedFile && name.trim()) {
      await updateFile(selectedFile.id, { name })
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div
      className="h-[calc(100vh-4rem)] flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop Zone Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary m-4 rounded-lg animate-in fade-in zoom-in-95">
          <div className="bg-background p-8 rounded-xl shadow-xl flex flex-col items-center gap-4">
            <Upload className="w-16 h-16 text-primary animate-bounce" />
            <h3 className="text-2xl font-bold">Solte arquivos Markdown aqui</h3>
            <p className="text-muted-foreground">
              Importação automática para o Docs Hub
            </p>
          </div>
        </div>
      )}

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 rounded-lg border m-4 bg-background shadow-sm overflow-hidden"
      >
        {/* Left Panel: Navigation */}
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={40}
          className="flex flex-col bg-muted/10"
        >
          <div className="p-4 border-b flex items-center justify-between bg-muted/30">
            <span className="font-semibold text-sm">Estrutura</span>
            <span className="text-xs text-muted-foreground">
              {currentFolder ? currentFolder.name : 'Raiz'}
            </span>
          </div>
          <ScrollArea className="flex-1 p-2">
            <FolderTree
              currentFolderId={selectedFolderId}
              onSelectFolder={(id) => {
                setSelectedFolderId(id)
                setSelectedFileId(null)
              }}
            />
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Content */}
        <ResizablePanel defaultSize={75} className="flex flex-col">
          {selectedFileId && selectedFile ? (
            // Editor View
            <div className="flex flex-col h-full">
              <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {isEditingFile ? (
                    <Input
                      value={selectedFile.name}
                      onChange={(e) => handleRenameFile(e.target.value)}
                      className="h-8 w-64"
                      onBlur={() => setIsEditingFile(false)}
                      autoFocus
                    />
                  ) : (
                    <h2
                      className="font-semibold text-lg cursor-pointer hover:underline decoration-dashed underline-offset-4"
                      onClick={() => setIsEditingFile(true)}
                    >
                      {selectedFile.name}
                    </h2>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    {formatDistanceToNow(new Date(selectedFile.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFileId(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm('Excluir documento?')) {
                        deleteFile(selectedFile.id)
                        setSelectedFileId(null)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <MarkdownEditor
                  content={selectedFile.content}
                  onChange={handleSaveContent}
                />
              </div>
            </div>
          ) : (
            // File List View
            <div className="flex flex-col h-full bg-muted/5">
              <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {currentFolder ? currentFolder.name : 'Documentos'}
                    </h2>
                    <p className="text-muted-foreground">
                      {folderFiles.length} documentos nesta pasta
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isCreatingFile ? (
                      <div className="flex gap-2 animate-in slide-in-from-right-4">
                        <Input
                          placeholder="Nome do arquivo..."
                          className="w-48"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleCreateFile()
                          }
                          autoFocus
                        />
                        <Button onClick={handleCreateFile}>Criar</Button>
                        <Button
                          variant="ghost"
                          onClick={() => setIsCreatingFile(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsCreatingFile(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Novo Documento
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 pb-6">
                {folderFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                    <File className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Pasta vazia</p>
                    <p className="text-sm">
                      Crie um novo documento ou arraste arquivos para importar.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folderFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
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
                          <p className="text-xs text-muted-foreground">
                            Atualizado{' '}
                            {formatDistanceToNow(new Date(file.updatedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        files={droppedFiles}
      />
    </div>
  )
}
