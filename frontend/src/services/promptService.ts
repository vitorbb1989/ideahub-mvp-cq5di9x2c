import { PromptTemplate } from '@/types'
import { STORAGE_KEYS, getStored, setStored, generateId } from './storage'

class PromptService {
  async getTemplates(userId: string): Promise<PromptTemplate[]> {
    const allTemplates = getStored<PromptTemplate[]>(
      STORAGE_KEYS.PROMPT_TEMPLATES,
      [],
    )
    return allTemplates
      .filter((t) => t.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }

  async createTemplate(
    userId: string,
    data: { title: string; content: string },
  ): Promise<PromptTemplate> {
    const templates = getStored<PromptTemplate[]>(
      STORAGE_KEYS.PROMPT_TEMPLATES,
      [],
    )

    const newTemplate: PromptTemplate = {
      id: generateId(),
      userId,
      title: data.title,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    templates.unshift(newTemplate)
    setStored(STORAGE_KEYS.PROMPT_TEMPLATES, templates)
    return newTemplate
  }

  async updateTemplate(
    id: string,
    data: { title?: string; content?: string },
  ): Promise<PromptTemplate> {
    const templates = getStored<PromptTemplate[]>(
      STORAGE_KEYS.PROMPT_TEMPLATES,
      [],
    )
    const index = templates.findIndex((t) => t.id === id)

    if (index === -1) throw new Error('Template not found')

    const updatedTemplate = {
      ...templates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    templates[index] = updatedTemplate
    setStored(STORAGE_KEYS.PROMPT_TEMPLATES, templates)
    return updatedTemplate
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = getStored<PromptTemplate[]>(
      STORAGE_KEYS.PROMPT_TEMPLATES,
      [],
    )
    const filtered = templates.filter((t) => t.id !== id)
    setStored(STORAGE_KEYS.PROMPT_TEMPLATES, filtered)
  }
}

export const promptService = new PromptService()
