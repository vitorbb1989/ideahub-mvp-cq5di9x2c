import { DocFolder, DocFile, DocsProvider } from '@/types'
import { apiCall } from '@/lib/apiMiddleware'
import { cacheService } from '@/lib/cache'

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
      // Also invalidate ideas that might have linked this file
      cacheService.invalidate('idea-docs-')
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
}

export const docsApiProvider = new DocsApiProvider()
