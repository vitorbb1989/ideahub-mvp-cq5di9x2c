/* Stub for API Provider */
import { DocFolder, DocFile, DocsProvider } from '@/types'

class DocsApiProvider implements DocsProvider {
  async listFolders(): Promise<DocFolder[]> {
    throw new Error('Not implemented')
  }
  async createFolder(): Promise<DocFolder> {
    throw new Error('Not implemented')
  }
  async renameFolder(): Promise<void> {
    throw new Error('Not implemented')
  }
  async deleteFolder(): Promise<void> {
    throw new Error('Not implemented')
  }
  async listFiles(): Promise<DocFile[]> {
    throw new Error('Not implemented')
  }
  async createFile(): Promise<DocFile> {
    throw new Error('Not implemented')
  }
  async updateFile(): Promise<DocFile> {
    throw new Error('Not implemented')
  }
  async deleteFile(): Promise<void> {
    throw new Error('Not implemented')
  }
  async linkDocToIdea(): Promise<void> {
    throw new Error('Not implemented')
  }
  async unlinkDocFromIdea(): Promise<void> {
    throw new Error('Not implemented')
  }
  async listIdeaDocs(): Promise<DocFile[]> {
    throw new Error('Not implemented')
  }
}

export const docsApiProvider = new DocsApiProvider()
