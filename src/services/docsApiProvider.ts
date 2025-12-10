import { DocFolder, DocFile, DocsProvider, DocVersion } from '@/types'
import { apiCall } from '@/lib/apiMiddleware'
import { cacheService } from '@/lib/cache'
import {
  getStored,
  setStored,
  STORAGE_KEYS,
  generateId,
} from '@/services/storage'

const BASE_URL = '/api'

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let message = `Erro API: ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData.message) message = errorData.message
      else if (errorData.detail) message = errorData.detail
      else if (errorData.error) message = errorData.error
    } catch {
      // Ignore JSON parse error, use status text
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

class DocsApiProvider implements DocsProvider {
  async listFolders(): Promise<DocFolder[]> {
    return apiCall(
      'GET /docs/folders',
      () => request<DocFolder[]>('/docs/folders'),
      { cacheKey: 'docs-folders', ttl: 60 },
    )
  }

  async createFolder(
    name: string,
    parentId: string | null,
  ): Promise<DocFolder> {
    return apiCall('POST /docs/folders', async () => {
      const folder = await request<DocFolder>('/docs/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parentId }),
      })
      cacheService.invalidate('docs-folders')
      return folder
    })
  }

  async renameFolder(id: string, name: string): Promise<void> {
    return apiCall(`PATCH /docs/folders/${id}`, async () => {
      await request(`/docs/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      cacheService.invalidate('docs-folders')
    })
  }

  async deleteFolder(
    id: string,
    action: 'delete_content' | 'move_to_root',
  ): Promise<void> {
    return apiCall(`DELETE /docs/folders/${id}`, async () => {
      await request(`/docs/folders/${id}?action=${action}`, {
        method: 'DELETE',
      })
      cacheService.invalidate('docs-folders')
      cacheService.invalidate('docs-files')
    })
  }

  async listFiles(): Promise<DocFile[]> {
    return apiCall('GET /docs/files', () => request<DocFile[]>('/docs/files'), {
      cacheKey: 'docs-files',
      ttl: 60,
    })
  }

  // Internal helper to save version locally
  private saveVersionLocally(docId: string, content: string, name: string) {
    const versions = getStored<DocVersion[]>(STORAGE_KEYS.DOCS_VERSIONS, [])

    // Check for duplicate of latest version
    const docVersions = versions.filter((v) => v.docId === docId)
    if (
      docVersions.length > 0 &&
      docVersions[0].content === content &&
      docVersions[0].name === name
    ) {
      return
    }

    const newVersion: DocVersion = {
      id: generateId(),
      docId,
      content,
      name,
      createdAt: new Date().toISOString(),
    }

    const otherVersions = versions.filter((v) => v.docId !== docId)
    // Keep last 50 versions for this document
    const updatedDocVersions = [newVersion, ...docVersions].slice(0, 50)

    setStored(STORAGE_KEYS.DOCS_VERSIONS, [
      ...otherVersions,
      ...updatedDocVersions,
    ])
  }

  async createFile(
    name: string,
    content: string,
    folderId: string | null,
  ): Promise<DocFile> {
    return apiCall('POST /docs/files', async () => {
      const file = await request<DocFile>('/docs/files', {
        method: 'POST',
        body: JSON.stringify({ name, content, folderId }),
      })

      this.saveVersionLocally(file.id, content, name)

      cacheService.invalidate('docs-files')
      return file
    })
  }

  async updateFile(
    id: string,
    updates: { name?: string; content?: string; folderId?: string | null },
  ): Promise<DocFile> {
    return apiCall(`PATCH /docs/files/${id}`, async () => {
      const file = await request<DocFile>(`/docs/files/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      // Save version if content or name changed
      if (updates.content !== undefined || updates.name !== undefined) {
        this.saveVersionLocally(file.id, file.content, file.name)
      }

      cacheService.invalidate('docs-files')
      return file
    })
  }

  async deleteFile(id: string): Promise<void> {
    return apiCall(`DELETE /docs/files/${id}`, async () => {
      await request(`/docs/files/${id}`, {
        method: 'DELETE',
      })
      cacheService.invalidate('docs-files')
      cacheService.invalidate('idea-docs-')

      // Clean up versions locally
      const versions = getStored<DocVersion[]>(STORAGE_KEYS.DOCS_VERSIONS, [])
      setStored(
        STORAGE_KEYS.DOCS_VERSIONS,
        versions.filter((v) => v.docId !== id),
      )
    })
  }

  async linkDocToIdea(ideaId: string, docId: string): Promise<void> {
    return apiCall(`POST /ideas/${ideaId}/docs`, async () => {
      await request(`/ideas/${ideaId}/docs`, {
        method: 'POST',
        body: JSON.stringify({ docId }),
      })
      cacheService.invalidate(`idea-docs-${ideaId}`)
    })
  }

  async unlinkDocFromIdea(ideaId: string, docId: string): Promise<void> {
    return apiCall(`DELETE /ideas/${ideaId}/docs/${docId}`, async () => {
      await request(`/ideas/${ideaId}/docs/${docId}`, {
        method: 'DELETE',
      })
      cacheService.invalidate(`idea-docs-${ideaId}`)
    })
  }

  async listIdeaDocs(ideaId: string): Promise<DocFile[]> {
    return apiCall(
      `GET /ideas/${ideaId}/docs`,
      () => request<DocFile[]>(`/ideas/${ideaId}/docs`),
      { cacheKey: `idea-docs-${ideaId}`, ttl: 30 },
    )
  }

  // Version Control Methods
  async listVersions(docId: string): Promise<DocVersion[]> {
    // Local implementation since backend might not support it
    const versions = getStored<DocVersion[]>(STORAGE_KEYS.DOCS_VERSIONS, [])
    return versions
      .filter((v) => v.docId === docId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }

  async restoreVersion(docId: string, versionId: string): Promise<void> {
    const versions = await this.listVersions(docId)
    const version = versions.find((v) => v.id === versionId)
    if (!version) throw new Error('Version not found')

    // Restore by calling updateFile
    await this.updateFile(docId, {
      content: version.content,
      name: version.name,
    })
  }
}

export const docsApiProvider = new DocsApiProvider()
