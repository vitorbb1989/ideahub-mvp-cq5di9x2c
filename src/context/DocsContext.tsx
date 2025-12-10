import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { DocFolder, DocFile } from '@/types'
import { docsLocalProvider as provider } from '@/services/docsLocalProvider'
import { useToast } from '@/hooks/use-toast'

interface DocsContextType {
  folders: DocFolder[]
  files: DocFile[]
  isLoading: boolean
  refreshDocs: () => Promise<void>
  createFolder: (name: string, parentId: string | null) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (
    id: string,
    action: 'delete_content' | 'move_to_root',
  ) => Promise<void>
  createFile: (
    name: string,
    content: string,
    folderId: string | null,
  ) => Promise<void>
  updateFile: (
    id: string,
    updates: { name?: string; content?: string; folderId?: string | null },
  ) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  linkDocToIdea: (ideaId: string, docId: string) => Promise<void>
  unlinkDocFromIdea: (ideaId: string, docId: string) => Promise<void>
  getIdeaDocs: (ideaId: string) => Promise<DocFile[]>
}

const DocsContext = createContext<DocsContextType | undefined>(undefined)

export const DocsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [folders, setFolders] = useState<DocFolder[]>([])
  const [files, setFiles] = useState<DocFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const refreshDocs = useCallback(async () => {
    try {
      const [fld, fls] = await Promise.all([
        provider.listFolders(),
        provider.listFiles(),
      ])
      setFolders(fld)
      setFiles(fls)
    } catch (error) {
      console.error(error)
      toast({ variant: 'destructive', title: 'Erro ao carregar documentos' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refreshDocs()
  }, [refreshDocs])

  const createFolder = async (name: string, parentId: string | null) => {
    try {
      await provider.createFolder(name, parentId)
      await refreshDocs()
      toast({ title: 'Pasta criada' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Falha desconhecida',
      })
      throw error
    }
  }

  const renameFolder = async (id: string, name: string) => {
    try {
      await provider.renameFolder(id, name)
      await refreshDocs()
      toast({ title: 'Pasta renomeada' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Falha desconhecida',
      })
      throw error
    }
  }

  const deleteFolder = async (
    id: string,
    action: 'delete_content' | 'move_to_root',
  ) => {
    try {
      await provider.deleteFolder(id, action)
      await refreshDocs()
      toast({ title: 'Pasta removida' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro' })
      throw error
    }
  }

  const createFile = async (
    name: string,
    content: string,
    folderId: string | null,
  ) => {
    try {
      await provider.createFile(name, content, folderId)
      await refreshDocs()
      toast({ title: 'Documento criado' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Falha desconhecida',
      })
      throw error
    }
  }

  const updateFile = async (
    id: string,
    updates: { name?: string; content?: string; folderId?: string | null },
  ) => {
    try {
      await provider.updateFile(id, updates)
      await refreshDocs()
      if (updates.name) toast({ title: 'Documento atualizado' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Falha desconhecida',
      })
      throw error
    }
  }

  const deleteFile = async (id: string) => {
    try {
      await provider.deleteFile(id)
      await refreshDocs()
      toast({ title: 'Documento removido' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro' })
      throw error
    }
  }

  const linkDocToIdea = async (ideaId: string, docId: string) => {
    try {
      await provider.linkDocToIdea(ideaId, docId)
      toast({ title: 'Documento vinculado' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao vincular' })
      throw error
    }
  }

  const unlinkDocFromIdea = async (ideaId: string, docId: string) => {
    try {
      await provider.unlinkDocFromIdea(ideaId, docId)
      toast({ title: 'Vínculo removido' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao desvincular' })
      throw error
    }
  }

  const getIdeaDocs = async (ideaId: string) => {
    return provider.listIdeaDocs(ideaId)
  }

  return (
    <DocsContext.Provider
      value={{
        folders,
        files,
        isLoading,
        refreshDocs,
        createFolder,
        renameFolder,
        deleteFolder,
        createFile,
        updateFile,
        deleteFile,
        linkDocToIdea,
        unlinkDocFromIdea,
        getIdeaDocs,
      }}
    >
      {children}
    </DocsContext.Provider>
  )
}

export const useDocs = () => {
  const context = useContext(DocsContext)
  if (!context) throw new Error('useDocs must be used within a DocsProvider')
  return context
}
