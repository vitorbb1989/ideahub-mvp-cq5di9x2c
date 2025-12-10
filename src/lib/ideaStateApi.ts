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
  addChecklistItem(ideaId: string, label: string): Promise<IdeaChecklistItem>
  updateChecklistItem(
    ideaId: string,
    itemId: string,
    updates: Partial<IdeaChecklistItem>,
  ): Promise<void>
  removeChecklistItem(ideaId: string, itemId: string): Promise<void>

  getReferences(ideaId: string): Promise<IdeaReferenceLink[]>
  saveReferences(ideaId: string, links: IdeaReferenceLink[]): Promise<void>

  getSnapshots(ideaId: string): Promise<IdeaSnapshot[]>
  createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void>
  updateSnapshot(
    ideaId: string,
    snapshotId: string,
    updates: { title: string },
  ): Promise<void>

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

  async saveLastState(ideaId: string, newState: IdeaLastState): Promise<void> {
    await delay(200)
    const oldState = this.getStored<IdeaLastState>(
      STORAGE_KEYS.LAST_STATES,
      ideaId,
    )

    // Diff Logic
    if (oldState) {
      const changes = []
      const keys: (keyof IdeaLastState)[] = [
        'whereIStopped',
        'whatIWasDoing',
        'nextStep',
      ]
      keys.forEach((key) => {
        if (oldState[key] !== newState[key]) {
          changes.push({
            field: key,
            oldValue: oldState[key],
            newValue: newState[key],
          })
        }
      })

      if (changes.length > 0) {
        await this.logEvent(ideaId, 'last_state_updated', { changes })
      }
    } else {
      // First save
      await this.logEvent(ideaId, 'last_state_updated', {
        changes: [
          {
            field: 'whereIStopped',
            oldValue: '',
            newValue: newState.whereIStopped,
          },
          {
            field: 'whatIWasDoing',
            oldValue: '',
            newValue: newState.whatIWasDoing,
          },
          { field: 'nextStep', oldValue: '', newValue: newState.nextStep },
        ],
      })
    }

    this.setStored(STORAGE_KEYS.LAST_STATES, ideaId, newState)
  }

  // --- Checklist Operations ---

  async getChecklist(ideaId: string): Promise<IdeaChecklistItem[]> {
    await delay(200)
    return (
      this.getStored<IdeaChecklistItem[]>(STORAGE_KEYS.CHECKLISTS, ideaId) || []
    )
  }

  async addChecklistItem(
    ideaId: string,
    label: string,
  ): Promise<IdeaChecklistItem> {
    await delay(200)
    const items = (await this.getChecklist(ideaId)) || []
    const newItem: IdeaChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      label,
      done: false,
    }
    const updatedItems = [...items, newItem]
    this.setStored(STORAGE_KEYS.CHECKLISTS, ideaId, updatedItems)

    await this.logEvent(ideaId, 'checklist_updated', {
      added: [newItem],
      removed: [],
      updated: [],
    })

    return newItem
  }

  async updateChecklistItem(
    ideaId: string,
    itemId: string,
    updates: Partial<IdeaChecklistItem>,
  ): Promise<void> {
    await delay(200)
    const items = (await this.getChecklist(ideaId)) || []
    const index = items.findIndex((i) => i.id === itemId)
    if (index === -1) return

    const original = items[index]
    const updated = { ...original, ...updates }
    items[index] = updated

    this.setStored(STORAGE_KEYS.CHECKLISTS, ideaId, items)

    const change = original.done !== updated.done ? 'status' : 'label'
    await this.logEvent(ideaId, 'checklist_updated', {
      added: [],
      removed: [],
      updated: [
        {
          ...updated,
          change,
          oldValue: change === 'label' ? original.label : original.done,
          newValue: change === 'label' ? updated.label : updated.done,
        },
      ],
    })
  }

  async removeChecklistItem(ideaId: string, itemId: string): Promise<void> {
    await delay(200)
    const items = (await this.getChecklist(ideaId)) || []
    const itemToRemove = items.find((i) => i.id === itemId)
    if (!itemToRemove) return

    const updatedItems = items.filter((i) => i.id !== itemId)
    this.setStored(STORAGE_KEYS.CHECKLISTS, ideaId, updatedItems)

    await this.logEvent(ideaId, 'checklist_updated', {
      added: [],
      removed: [itemToRemove],
      updated: [],
    })
  }

  async getReferences(ideaId: string): Promise<IdeaReferenceLink[]> {
    await delay(200)
    return (
      this.getStored<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) || []
    )
  }

  async saveReferences(
    ideaId: string,
    newLinks: IdeaReferenceLink[],
  ): Promise<void> {
    await delay(200)
    const oldLinks =
      this.getStored<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) || []

    // Diff Logic
    const added = newLinks.filter((n) => !oldLinks.find((o) => o.id === n.id))
    const removed = oldLinks.filter((o) => !newLinks.find((n) => n.id === o.id))
    const updated = newLinks
      .filter((n) => {
        const o = oldLinks.find((o) => o.id === n.id)
        return o && (o.title !== n.title || o.url !== n.url)
      })
      .map((n) => {
        const o = oldLinks.find((o) => o.id === n.id)!
        let changeType = 'title'
        if (o.title !== n.title && o.url !== n.url) changeType = 'both'
        else if (o.url !== n.url) changeType = 'url'

        return {
          ...n,
          oldTitle: o.title,
          newTitle: n.title,
          oldUrl: o.url,
          newUrl: n.url,
          change: changeType,
        }
      })

    if (added.length > 0 || removed.length > 0 || updated.length > 0) {
      await this.logEvent(ideaId, 'references_updated', {
        added,
        removed,
        updated,
      })
    }

    this.setStored(STORAGE_KEYS.REFERENCES, ideaId, newLinks)
  }

  // --- Snapshot Operations ---

  async getSnapshots(ideaId: string): Promise<IdeaSnapshot[]> {
    await delay(200)
    return this.getStored<IdeaSnapshot[]>(STORAGE_KEYS.SNAPSHOTS, ideaId) || []
  }

  async createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void> {
    await delay(200)
    const snapshots = (await this.getSnapshots(ideaId)) || []
    snapshots.unshift(snapshot)
    this.setStored(STORAGE_KEYS.SNAPSHOTS, ideaId, snapshots)

    await this.logEvent(ideaId, 'snapshot_created', {
      snapshotId: snapshot.id,
      title: snapshot.title,
    })
  }

  async updateSnapshot(
    ideaId: string,
    snapshotId: string,
    updates: { title: string },
  ): Promise<void> {
    await delay(200)
    const snapshots = (await this.getSnapshots(ideaId)) || []
    const index = snapshots.findIndex((s) => s.id === snapshotId)
    if (index === -1) return

    snapshots[index] = { ...snapshots[index], ...updates }
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
    const events =
      this.getStored<IdeaTimelineEvent[]>(
        STORAGE_KEYS.TIMELINE_EVENTS,
        ideaId,
      ) || []
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
