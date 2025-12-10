import { useState } from 'react'
import { DocFile, DocFolder } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Folder, FolderOpen } from 'lucide-react'
import { useDocs } from '@/context/DocsContext'
import { cn } from '@/lib/utils'

interface DocumentPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (docId: string) => void
  excludeIds?: string[]
}

export function DocumentPicker({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: DocumentPickerProps) {
  const { folders, files } = useDocs()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderTree = (folderId: string | null, depth = 0) => {
    const currentFolders = folders.filter((f) => f.parentId === folderId)
    const currentFiles = files.filter(
      (f) => f.folderId === folderId && !excludeIds.includes(f.id),
    )

    return (
      <div className="space-y-1">
        {currentFolders.map((folder) => {
          const isExpanded = expanded[folder.id]
          return (
            <div key={folder.id}>
              <div
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => toggleExpand(folder.id)}
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-primary" />
                ) : (
                  <Folder className="w-4 h-4 text-primary" />
                )}
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
              {isExpanded && renderTree(folder.id, depth + 1)}
            </div>
          )
        })}
        {currentFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer group"
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
            onClick={() => {
              onSelect(file.id)
              onClose()
            }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{file.name}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs opacity-0 group-hover:opacity-100"
            >
              Selecionar
            </Button>
          </div>
        ))}
        {currentFolders.length === 0 && currentFiles.length === 0 && (
          <div
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
            className="text-xs text-muted-foreground py-1 italic"
          >
            Vazio
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Documento</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 border rounded-md p-2">
          {renderTree(null)}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
