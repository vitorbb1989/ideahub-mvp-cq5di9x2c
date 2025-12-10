import { useState, useRef, useMemo, useEffect } from 'react'
import { FolderTree } from '@/components/docs/FolderTree'
import { MarkdownEditor } from '@/components/docs/MarkdownEditor'
import { ImportModal } from '@/components/docs/ImportModal'
import { DocsFileList } from '@/components/docs/DocsFileList'
import { VersionHistory } from '@/components/docs/VersionHistory'
import { getSnippet } from '@/components/docs/docsUtils'
import { useDocs } from '@/context/DocsContext'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  Search,
  X,
  History,
  Save,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function Docs() {
  const { folders, files, createFile, updateFile, deleteFile, isLoading } =
    useDocs()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [isEditingFile, setIsEditingFile] = useState(false)

  // Editor State
  const [localContent, setLocalContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Version History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  // Create File State
  const [newFileName, setNewFileName] = useState('')
  const [isCreatingFile, setIsCreatingFile] = useState(false)

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  const dragCounter = useRef(0)

  const selectedFile = files.find((f) => f.id === selectedFileId)
  const currentFolder = folders.find((f) => f.id === selectedFolderId)

  // Sync local content when file changes or is updated externally
  useEffect(() => {
    if (selectedFile) {
      // Only update local content if we are NOT currently typing/saving to avoid overwriting cursor
      // or if the IDs mismatch (switching files)
      setLocalContent(selectedFile.content)
    }
  }, [selectedFileId, files]) // Depend on files too to catch restore updates

  // Debounced Auto-Save
  useEffect(() => {
    if (!selectedFile || localContent === selectedFile.content) {
      setIsSaving(false)
      return
    }

    setIsSaving(true)
    const timer = setTimeout(async () => {
      await updateFile(selectedFile.id, { content: localContent })
      setIsSaving(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [localContent, selectedFile, updateFile])

  // Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q),
    )
  }, [files, searchQuery])

  const displayedFiles = searchQuery.trim()
    ? searchResults
    : files.filter((f) => f.folderId === selectedFolderId)

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

  // Handle immediate save from editor (e.g. CTRL+S) - NOT IMPLEMENTED in MarkdownEditor but good to have
  const handleImmediateSave = async (content: string) => {
    setLocalContent(content)
    // If needed we could force save immediately here
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
        {/* Left Panel: Navigation & Search */}
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={40}
          className="flex flex-col bg-muted/10"
        >
          {/* Search Input */}
          <div className="p-2 border-b space-y-2 bg-background/50">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {searchQuery.trim() ? (
            // Search Results List (Sidebar)
            <div className="flex flex-col h-full bg-muted/10">
              <div className="p-2 pb-0 text-xs font-semibold text-muted-foreground mb-2 px-4 pt-2">
                {searchResults.length} encontrados
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 pb-2 space-y-1">
                  {searchResults.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent text-sm group',
                        selectedFileId === file.id && 'bg-accent',
                      )}
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{file.name}</div>
                        <div className="truncate text-xs text-muted-foreground opacity-70">
                          {getSnippet(file.content, searchQuery)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4 text-center">
                      Nenhum documento encontrado.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Normal Folder Tree
            <>
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
            </>
          )}
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
                  {isSaving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                      <Save className="w-3 h-3" /> Salvando...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    {formatDistanceToNow(new Date(selectedFile.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsHistoryOpen(true)}
                    title="Histórico de Versões"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Histórico
                  </Button>
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
                  content={localContent}
                  onChange={setLocalContent}
                />
              </div>
            </div>
          ) : (
            // File List View (Uses extracted component)
            <DocsFileList
              files={displayedFiles}
              currentFolder={currentFolder}
              searchQuery={searchQuery}
              onSelectFile={setSelectedFileId}
              isCreating={isCreatingFile}
              onStartCreate={() => setIsCreatingFile(true)}
              onCancelCreate={() => setIsCreatingFile(false)}
              onCreate={handleCreateFile}
              newFileName={newFileName}
              setNewFileName={setNewFileName}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        files={droppedFiles}
      />

      {selectedFile && (
        <VersionHistory
          docId={selectedFile.id}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  )
}
