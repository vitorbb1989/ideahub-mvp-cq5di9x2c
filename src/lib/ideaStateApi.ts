import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaSnapshot,
  IdeaTimelineEvent,
  IdeaTimelineEventType,
} from '@/types'
import { ideaStateStorage } from './ideaStateStorage'

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

// Stub implementation for future API integration
// Currently using local storage service
class IdeaStateApiImpl implements IdeaStateProvider {
  async getLastState(ideaId: string): Promise<IdeaLastState | null> {
    // API Call would go here
    return ideaStateStorage.getLastState(ideaId)
  }

  async saveLastState(ideaId: string, state: IdeaLastState): Promise<void> {
    // API Call would go here
    ideaStateStorage.saveLastState(ideaId, state)
  }

  async getChecklist(ideaId: string): Promise<IdeaChecklistItem[]> {
    return ideaStateStorage.getChecklist(ideaId)
  }

  async saveChecklist(
    ideaId: string,
    items: IdeaChecklistItem[],
  ): Promise<void> {
    ideaStateStorage.saveChecklist(ideaId, items)
  }

  async getReferences(ideaId: string): Promise<IdeaReferenceLink[]> {
    return ideaStateStorage.getReferences(ideaId)
  }

  async saveReferences(
    ideaId: string,
    links: IdeaReferenceLink[],
  ): Promise<void> {
    ideaStateStorage.saveReferences(ideaId, links)
  }

  async getSnapshots(ideaId: string): Promise<IdeaSnapshot[]> {
    return ideaStateStorage.getSnapshots(ideaId)
  }

  async createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void> {
    ideaStateStorage.saveSnapshot(ideaId, snapshot)
  }

  async getEvents(ideaId: string): Promise<IdeaTimelineEvent[]> {
    return ideaStateStorage.getEvents(ideaId)
  }

  async logEvent(
    ideaId: string,
    type: IdeaTimelineEventType,
    payload?: Record<string, any>,
  ): Promise<void> {
    const event: IdeaTimelineEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      createdAt: new Date().toISOString(),
      payload,
    }
    ideaStateStorage.saveEvent(ideaId, event)
  }
}

export const ideaStateApi = new IdeaStateApiImpl()
