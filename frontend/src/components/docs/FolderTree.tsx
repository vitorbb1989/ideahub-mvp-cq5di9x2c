import { useState } from 'react'
import { DocFolder } from '@/types'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDocs } from '@/context/DocsContext'

interface FolderTreeProps {
  currentFolderId: string | null
  onSelectFolder: (id: string | null) => void
}

export function FolderTree({
  currentFolderId,
  onSelectFolder,
}: FolderTreeProps) {
  const { folders, createFolder, renameFolder, deleteFolder } = useDocs()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [targetFolder, setTargetFolder] = useState<DocFolder | null>(null)
  const [folderName, setFolderName] = useState('')

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCreate = async () => {
    if (!folderName.trim()) return
    await createFolder(folderName, targetFolder?.id || null)
    setIsCreateOpen(false)
    setFolderName('')
    if (targetFolder)
      setExpanded((prev) => ({ ...prev, [targetFolder.id]: true }))
  }

  const handleRename = async () => {
    if (!folderName.trim() || !targetFolder) return
    await renameFolder(targetFolder.id, folderName)
    setIsRenameOpen(false)
    setFolderName('')
  }

  const handleDelete = async (action: 'delete_content' | 'move_to_root') => {
    if (!targetFolder) return
    await deleteFolder(targetFolder.id, action)
    setIsDeleteOpen(false)
    if (currentFolderId === targetFolder.id) onSelectFolder(null)
  }

  const openCreateDialog = (parent: DocFolder | null) => {
    setTargetFolder(parent)
    setFolderName('')
    setIsCreateOpen(true)
  }

  const renderFolder = (folder: DocFolder, depth = 0) => {
    const children = folders.filter((f) => f.parentId === folder.id)
    const isExpanded = expanded[folder.id]
    const isSelected = currentFolderId === folder.id

    return (
      <div key={folder.id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer hover:bg-accent group',
            isSelected && 'bg-accent',
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(folder.id)
            }}
          >
            {children.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <span className="w-3" />
            )}
          </Button>

          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-primary shrink-0" />
          )}

          <span className="text-sm truncate flex-1">{folder.name}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => openCreateDialog(folder)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Subpasta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTargetFolder(folder)
                  setFolderName(folder.name)
                  setIsRenameOpen(true)
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Renomear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setTargetFolder(folder)
                  setIsDeleteOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && children.map((child) => renderFolder(child, depth + 1))}
      </div>
    )
  }

  const rootFolders = folders.filter((f) => f.parentId === null)

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent font-medium text-sm',
          currentFolderId === null && 'bg-accent text-accent-foreground',
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4" />
        Raiz
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            openCreateDialog(null)
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {rootFolders.map((f) => renderFolder(f))}

      {/* Dialogs */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Nome da pasta"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Pasta</DialogTitle>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Novo nome"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pasta</DialogTitle>
            <DialogDescription>
              A pasta "{targetFolder?.name}" contém arquivos ou subpastas?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={() => handleDelete('delete_content')}
            >
              Excluir pasta e todo o conteúdo
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDelete('move_to_root')}
            >
              Excluir pasta mas mover arquivos para a Raiz
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
