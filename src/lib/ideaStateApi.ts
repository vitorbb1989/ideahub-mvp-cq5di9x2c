import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaSnapshot,
  IdeaTimelineEvent,
  IdeaTimelineEventType,
} from '@/types'

const STORAGE_KEYS = {
  LAST_STATES: 'ideahub_last_states',
  CHECKLISTS: 'ideahub_checklists',
  REFERENCES: 'ideahub_references',
  SNAPSHOTS: 'ideahub_snapshots',
  TIMELINE_EVENTS: 'ideahub_timeline_events',
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

class IdeaStateApiMock implements IdeaStateProvider {
  private getStored<T>(key: string, id: string): T | null {
    try {
      const allData = JSON.parse(localStorage.getItem(key) || '{}')
      return allData[id] || null
    } catch {
      return null
    }
  }

  private setStored<T>(key: string, id: string, value: T) {
    const allData = JSON.parse(localStorage.getItem(key) || '{}')
    allData[id] = value
    localStorage.setItem(key, JSON.stringify(allData))
  }

  async getLastState(ideaId: string): Promise<IdeaLastState | null> {
    await delay(200)
    return this.getStored<IdeaLastState>(STORAGE_KEYS.LAST_STATES, ideaId)
  }

  async saveLastState(ideaId: string, state: IdeaLastState): Promise<void> {
    await delay(200)
    this.setStored(STORAGE_KEYS.LAST_STATES, ideaId, state)
  }

  async getChecklist(ideaId: string): Promise<IdeaChecklistItem[]> {
    await delay(200)
    return (
      this.getStored<IdeaChecklistItem[]>(STORAGE_KEYS.CHECKLISTS, ideaId) || []
    )
  }

  async saveChecklist(
    ideaId: string,
    items: IdeaChecklistItem[],
  ): Promise<void> {
    await delay(200)
    this.setStored(STORAGE_KEYS.CHECKLISTS, ideaId, items)
  }

  async getReferences(ideaId: string): Promise<IdeaReferenceLink[]> {
    await delay(200)
    return (
      this.getStored<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) || []
    )
  }

  async saveReferences(
    ideaId: string,
    links: IdeaReferenceLink[],
  ): Promise<void> {
    await delay(200)
    this.setStored(STORAGE_KEYS.REFERENCES, ideaId, links)
  }

  async getSnapshots(ideaId: string): Promise<IdeaSnapshot[]> {
    await delay(200)
    return this.getStored<IdeaSnapshot[]>(STORAGE_KEYS.SNAPSHOTS, ideaId) || []
  }

  async createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void> {
    await delay(200)
    const snapshots = await this.getSnapshots(ideaId)
    snapshots.unshift(snapshot)
    this.setStored(STORAGE_KEYS.SNAPSHOTS, ideaId, snapshots)
  }

  async getEvents(ideaId: string): Promise<IdeaTimelineEvent[]> {
    await delay(200)
    return (
      this.getStored<IdeaTimelineEvent[]>(
        STORAGE_KEYS.TIMELINE_EVENTS,
        ideaId,
      ) || []
    )
  }

  async logEvent(
    ideaId: string,
    type: IdeaTimelineEventType,
    payload?: Record<string, any>,
  ): Promise<void> {
    const events = await this.getEvents(ideaId)
    const newEvent: IdeaTimelineEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      createdAt: new Date().toISOString(),
      payload,
    }
    events.unshift(newEvent)
    this.setStored(STORAGE_KEYS.TIMELINE_EVENTS, ideaId, events)
  }
}

export const ideaStateApi = new IdeaStateApiMock()
