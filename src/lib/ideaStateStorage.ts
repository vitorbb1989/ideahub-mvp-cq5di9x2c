import { IdeaLastState, IdeaReferenceLink, IdeaTimelineEvent } from '@/types'

const KEYS = {
  LAST_STATE: (id: string) => `ideahub:lastState:${id}`,
  REFERENCES: (id: string) => `ideahub:references:${id}`,
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

  getReferences: (ideaId: string): IdeaReferenceLink[] => {
    return get<IdeaReferenceLink[]>(KEYS.REFERENCES(ideaId), [])
  },
  saveReferences: (ideaId: string, links: IdeaReferenceLink[]): void => {
    set(KEYS.REFERENCES(ideaId), links)
  },

  getEvents: (ideaId: string): IdeaTimelineEvent[] => {
    return get<IdeaTimelineEvent[]>(KEYS.EVENTS(ideaId), [])
  },
  saveEvent: (ideaId: string, event: IdeaTimelineEvent): void => {
    const events = get<IdeaTimelineEvent[]>(KEYS.EVENTS(ideaId), [])
    set(KEYS.EVENTS(ideaId), [event, ...events])
  },
}
