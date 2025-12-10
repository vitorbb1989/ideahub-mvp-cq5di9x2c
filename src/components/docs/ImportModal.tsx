import { useState, useEffect } from 'react'
import { DocFolder } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, FolderPlus, Trash2 } from 'lucide-react'
import { useDocs } from '@/context/DocsContext'

interface PendingFile {
  file: File
  name: string
  folderId: string | null
  content: string
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  files: File[]
}

export function ImportModal({ isOpen, onClose, files }: ImportModalProps) {
  const { folders, createFolder, createFile } = useDocs()
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Quick folder creation
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    if (isOpen && files.length > 0) {
      const loadFiles = async () => {
        const loaded = await Promise.all(
          files.map(async (file) => {
            const text = await file.text()
            return {
              file,
              name: file.name.replace(/\.md$/i, ''),
              folderId: null, // Default to root
              content: text,
            }
          }),
        )
        setPendingFiles(loaded)
      }
      loadFiles()
    }
  }, [isOpen, files])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName, null)
    setNewFolderName('')
    setIsNewFolderOpen(false)
  }

  const updateFile = (index: number, updates: Partial<PendingFile>) => {
    setPendingFiles((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    )
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleImport = async () => {
    setIsProcessing(true)
    try {
      await Promise.all(
        pendingFiles.map((pf) => createFile(pf.name, pf.content, pf.folderId)),
      )
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Documentos</DialogTitle>
          <DialogDescription>
            Configure os detalhes dos arquivos antes de importar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
          <div className="flex justify-end mb-2">
            {isNewFolderOpen ? (
              <div className="flex gap-2 items-center animate-in fade-in slide-in-from-right-4">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nome da pasta"
                  className="w-40 h-8"
                />
                <Button size="sm" onClick={handleCreateFolder}>
                  Criar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsNewFolderOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewFolderOpen(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
              </Button>
            )}
          </div>

          <div className="border rounded-md flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Nome do Arquivo</TableHead>
                    <TableHead>Pasta de Destino</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingFiles.map((pf, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <Input
                            value={pf.name}
                            onChange={(e) =>
                              updateFile(i, { name: e.target.value })
                            }
                            className="h-8"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pf.folderId || 'root'}
                          onValueChange={(val) =>
                            updateFile(i, {
                              folderId: val === 'root' ? null : val,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Raiz" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="root">Raiz</SelectItem>
                            {folders.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFile(i)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isProcessing || pendingFiles.length === 0}
          >
            {isProcessing
              ? 'Importando...'
              : `Importar ${pendingFiles.length} Arquivos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
