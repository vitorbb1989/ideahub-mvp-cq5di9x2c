import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaSnapshot,
  IdeaTimelineEvent,
} from '@/types'

const KEYS = {
  LAST_STATE: (id: string) => `ideahub:lastState:${id}`,
  CHECKLIST: (id: string) => `ideahub:checklist:${id}`,
  REFERENCES: (id: string) => `ideahub:references:${id}`,
  SNAPSHOTS: (id: string) => `ideahub:snapshots:${id}`,
  EVENTS: (id: string) => `ideahub:events:${id}`,
}

function get<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error)
    return defaultValue
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error)
  }
}

export const ideaStateStorage = {
  getLastState: (ideaId: string): IdeaLastState | null => {
    return get<IdeaLastState | null>(KEYS.LAST_STATE(ideaId), null)
  },
  saveLastState: (ideaId: string, state: IdeaLastState): void => {
    set(KEYS.LAST_STATE(ideaId), state)
  },

  getChecklist: (ideaId: string): IdeaChecklistItem[] => {
    return get<IdeaChecklistItem[]>(KEYS.CHECKLIST(ideaId), [])
  },
  saveChecklist: (ideaId: string, items: IdeaChecklistItem[]): void => {
    set(KEYS.CHECKLIST(ideaId), items)
  },

  getReferences: (ideaId: string): IdeaReferenceLink[] => {
    return get<IdeaReferenceLink[]>(KEYS.REFERENCES(ideaId), [])
  },
  saveReferences: (ideaId: string, links: IdeaReferenceLink[]): void => {
    set(KEYS.REFERENCES(ideaId), links)
  },

  getSnapshots: (ideaId: string): IdeaSnapshot[] => {
    return get<IdeaSnapshot[]>(KEYS.SNAPSHOTS(ideaId), [])
  },
  saveSnapshot: (ideaId: string, snapshot: IdeaSnapshot): void => {
    const snapshots = get<IdeaSnapshot[]>(KEYS.SNAPSHOTS(ideaId), [])
    set(KEYS.SNAPSHOTS(ideaId), [snapshot, ...snapshots])
  },

  getEvents: (ideaId: string): IdeaTimelineEvent[] => {
    return get<IdeaTimelineEvent[]>(KEYS.EVENTS(ideaId), [])
  },
  saveEvent: (ideaId: string, event: IdeaTimelineEvent): void => {
    const events = get<IdeaTimelineEvent[]>(KEYS.EVENTS(ideaId), [])
    set(KEYS.EVENTS(ideaId), [event, ...events])
  },
}
