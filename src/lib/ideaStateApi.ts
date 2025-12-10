import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaSnapshot,
  IdeaTimelineEvent,
  IdeaTimelineEventType,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export interface IdeaStateProvider {
  getLastState(ideaId: string): Promise<IdeaLastState | null>
  saveLastState(ideaId: string, state: IdeaLastState): Promise<void>
  getChecklist(ideaId: string): Promise<IdeaChecklistItem[]>
  saveChecklist(ideaId: string, items: IdeaChecklistItem[]): Promise<void>
  getReferences(ideaId: string): Promise<IdeaReferenceLink[]>
  saveReferences(ideaId: string, links: IdeaReferenceLink[]): Promise<void>
  getSnapshots(ideaId: string): Promise<IdeaSnapshot[]>
  createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void>
  getEvents(ideaId: string): Promise<IdeaTimelineEvent[]>
  logEvent(
    ideaId: string,
    type: IdeaTimelineEventType,
    payload?: Record<string, any>,
  ): Promise<void>
}

class IdeaStateApiImpl implements IdeaStateProvider {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (response.status === 404) {
      // Handle 404 as null result (not found)
      return null as T
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async getLastState(ideaId: string): Promise<IdeaLastState | null> {
    return this.fetch<IdeaLastState | null>(`/ideas/${ideaId}/last-state`)
  }

  async saveLastState(ideaId: string, state: IdeaLastState): Promise<void> {
    await this.fetch(`/ideas/${ideaId}/last-state`, {
      method: 'PUT',
      body: JSON.stringify(state),
    })
  }

  async getChecklist(ideaId: string): Promise<IdeaChecklistItem[]> {
    const result = await this.fetch<IdeaChecklistItem[] | null>(
      `/ideas/${ideaId}/checklist`,
    )
    return result || []
  }

  async saveChecklist(
    ideaId: string,
    items: IdeaChecklistItem[],
  ): Promise<void> {
    await this.fetch(`/ideas/${ideaId}/checklist`, {
      method: 'PUT',
      body: JSON.stringify(items),
    })
  }

  async getReferences(ideaId: string): Promise<IdeaReferenceLink[]> {
    const result = await this.fetch<IdeaReferenceLink[] | null>(
      `/ideas/${ideaId}/references`,
    )
    return result || []
  }

  async saveReferences(
    ideaId: string,
    links: IdeaReferenceLink[],
  ): Promise<void> {
    await this.fetch(`/ideas/${ideaId}/references`, {
      method: 'PUT',
      body: JSON.stringify(links),
    })
  }

  async getSnapshots(ideaId: string): Promise<IdeaSnapshot[]> {
    const result = await this.fetch<IdeaSnapshot[] | null>(
      `/ideas/${ideaId}/snapshots`,
    )
    return result || []
  }

  async createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void> {
    await this.fetch(`/ideas/${ideaId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify(snapshot),
    })
  }

  async getEvents(ideaId: string): Promise<IdeaTimelineEvent[]> {
    const result = await this.fetch<IdeaTimelineEvent[] | null>(
      `/ideas/${ideaId}/events`,
    )
    return result || []
  }

  async logEvent(
    ideaId: string,
    type: IdeaTimelineEventType,
    payload?: Record<string, any>,
  ): Promise<void> {
    const event = {
      type,
      payload,
    }
    await this.fetch(`/ideas/${ideaId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }
}

export const ideaStateApi = new IdeaStateApiImpl()
