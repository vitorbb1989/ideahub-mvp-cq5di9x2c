import { DocFolder, DocFile, IdeaDocLink, DocsProvider } from '@/types'
import { STORAGE_KEYS, getStored, setStored, generateId } from './storage'

class DocsLocalProvider implements DocsProvider {
  async listFolders(): Promise<DocFolder[]> {
    return getStored<DocFolder[]>(STORAGE_KEYS.DOCS_FOLDERS, [])
  }

  async createFolder(
    name: string,
    parentId: string | null,
  ): Promise<DocFolder> {
    const folders = getStored<DocFolder[]>(STORAGE_KEYS.DOCS_FOLDERS, [])

    // Check duplicates
    if (
      folders.some(
        (f) =>
          f.parentId === parentId &&
          f.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new Error(`Já existe uma pasta com o nome "${name}" neste nível.`)
    }

    const newFolder: DocFolder = {
      id: generateId(),
      name,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    folders.push(newFolder)
    setStored(STORAGE_KEYS.DOCS_FOLDERS, folders)
    return newFolder
  }

  async renameFolder(id: string, name: string): Promise<void> {
    const folders = getStored<DocFolder[]>(STORAGE_KEYS.DOCS_FOLDERS, [])
    const folder = folders.find((f) => f.id === id)
    if (!folder) throw new Error('Pasta não encontrada')

    // Check duplicates
    if (
      folders.some(
        (f) =>
          f.parentId === folder.parentId &&
          f.id !== id &&
          f.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new Error(`Já existe uma pasta com o nome "${name}" neste nível.`)
    }

    folder.name = name
    folder.updatedAt = new Date().toISOString()
    setStored(STORAGE_KEYS.DOCS_FOLDERS, folders)
  }

  async deleteFolder(
    id: string,
    action: 'delete_content' | 'move_to_root',
  ): Promise<void> {
    const folders = getStored<DocFolder[]>(STORAGE_KEYS.DOCS_FOLDERS, [])
    const files = getStored<DocFile[]>(STORAGE_KEYS.DOCS_FILES, [])

    // Recursive helper to get all descendant folder IDs
    const getDescendants = (folderId: string): string[] => {
      const children = folders.filter((f) => f.parentId === folderId)
      return [folderId, ...children.flatMap((c) => getDescendants(c.id))]
    }

    const targetFolderIds = getDescendants(id)

    if (action === 'delete_content') {
      // Remove files in these folders
      const remainingFiles = files.filter((f) =>
        f.folderId ? !targetFolderIds.includes(f.folderId) : true,
      )
      setStored(STORAGE_KEYS.DOCS_FILES, remainingFiles)

      // Remove folders
      const remainingFolders = folders.filter(
        (f) => !targetFolderIds.includes(f.id),
      )
      setStored(STORAGE_KEYS.DOCS_FOLDERS, remainingFolders)
    } else {
      // Move files to root
      files.forEach((f) => {
        if (f.folderId && targetFolderIds.includes(f.folderId)) {
          f.folderId = null
          f.updatedAt = new Date().toISOString()
        }
      })
      setStored(STORAGE_KEYS.DOCS_FILES, files)

      // Move immediate child folders to root (optional logic, but usually simpler to just flatten or delete)
      // The requirement says "move contained documents to root directory".
      // It implies folders are deleted but files are saved.

      const remainingFolders = folders.filter(
        (f) => f.id !== id && !targetFolderIds.includes(f.id),
      )
      setStored(STORAGE_KEYS.DOCS_FOLDERS, remainingFolders)
    }
  }

  async listFiles(): Promise<DocFile[]> {
    return getStored<DocFile[]>(STORAGE_KEYS.DOCS_FILES, [])
  }

  async createFile(
    name: string,
    content: string,
    folderId: string | null,
  ): Promise<DocFile> {
    const files = getStored<DocFile[]>(STORAGE_KEYS.DOCS_FILES, [])

    // Check duplicates
    if (
      files.some(
        (f) =>
          f.folderId === folderId &&
          f.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new Error(`Já existe um arquivo com o nome "${name}" nesta pasta.`)
    }

    const newFile: DocFile = {
      id: generateId(),
      name,
      content,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    files.push(newFile)
    setStored(STORAGE_KEYS.DOCS_FILES, files)
    return newFile
  }

  async updateFile(
    id: string,
    updates: { name?: string; content?: string; folderId?: string | null },
  ): Promise<DocFile> {
    const files = getStored<DocFile[]>(STORAGE_KEYS.DOCS_FILES, [])
    const file = files.find((f) => f.id === id)
    if (!file) throw new Error('Arquivo não encontrado')

    if (updates.name && updates.name !== file.name) {
      const parentId =
        updates.folderId !== undefined ? updates.folderId : file.folderId
      if (
        files.some(
          (f) =>
            f.folderId === parentId &&
            f.id !== id &&
            f.name.toLowerCase() === updates.name?.toLowerCase(),
        )
      ) {
        throw new Error(
          `Já existe um arquivo com o nome "${updates.name}" nesta pasta.`,
        )
      }
      file.name = updates.name
    }

    if (updates.content !== undefined) file.content = updates.content
    if (updates.folderId !== undefined) file.folderId = updates.folderId

    file.updatedAt = new Date().toISOString()
    setStored(STORAGE_KEYS.DOCS_FILES, files)
    return file
  }

  async deleteFile(id: string): Promise<void> {
    const files = getStored<DocFile[]>(STORAGE_KEYS.DOCS_FILES, [])
    const links = getStored<IdeaDocLink[]>(STORAGE_KEYS.DOCS_LINKS, [])

    const remainingFiles = files.filter((f) => f.id !== id)
    setStored(STORAGE_KEYS.DOCS_FILES, remainingFiles)

    // Remove links
    const remainingLinks = links.filter((l) => l.docId !== id)
    setStored(STORAGE_KEYS.DOCS_LINKS, remainingLinks)
  }

  async linkDocToIdea(ideaId: string, docId: string): Promise<void> {
    const links = getStored<IdeaDocLink[]>(STORAGE_KEYS.DOCS_LINKS, [])
    if (links.some((l) => l.ideaId === ideaId && l.docId === docId)) return

    links.push({
      ideaId,
      docId,
      createdAt: new Date().toISOString(),
    })
    setStored(STORAGE_KEYS.DOCS_LINKS, links)
  }

  async unlinkDocFromIdea(ideaId: string, docId: string): Promise<void> {
    const links = getStored<IdeaDocLink[]>(STORAGE_KEYS.DOCS_LINKS, [])
    const remaining = links.filter(
      (l) => !(l.ideaId === ideaId && l.docId === docId),
    )
    setStored(STORAGE_KEYS.DOCS_LINKS, remaining)
  }

  async listIdeaDocs(ideaId: string): Promise<DocFile[]> {
    const links = getStored<IdeaDocLink[]>(STORAGE_KEYS.DOCS_LINKS, [])
    const files = getStored<DocFile[]>(STORAGE_KEYS.DOCS_FILES, [])

    const docIds = links.filter((l) => l.ideaId === ideaId).map((l) => l.docId)
    return files.filter((f) => docIds.includes(f.id))
  }
}

export const docsLocalProvider = new DocsLocalProvider()
