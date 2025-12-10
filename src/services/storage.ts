// Shared constants and helpers for LocalStorage services

export const STORAGE_KEYS = {
  // From original api.ts
  IDEAS: 'ideahub_ideas',
  TAGS: 'ideahub_tags',
  USERS: 'ideahub_users',
  SESSION: 'ideahub_session',
  ACTIVITIES: 'ideahub_activities',
  TIMELINE_EVENTS: 'ideahub_timeline_events',

  // From original ideaStateApi.ts
  LAST_STATES: 'ideahub_last_states',
  CHECKLISTS: 'ideahub_checklists',
  REFERENCES: 'ideahub_references',
  ATTACHMENTS: 'ideahub_attachments',
  SNAPSHOTS: 'ideahub_snapshots',

  // New
  PROMPT_TEMPLATES: 'ideahub_prompt_templates',
}

export const generateId = () => Math.random().toString(36).substring(2, 9)

export function getStored<T>(key: string, initial: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initial
  } catch (e) {
    console.error('LocalStorage read error:', e)
    return initial
  }
}

export function setStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('LocalStorage write error:', e)
    throw new Error('Falha ao salvar dados. Armazenamento cheio?')
  }
}

// Specialized for keyed storage (like idea-specific data where data is stored as Record<string, T>)
export function getStoredItem<T>(key: string, id: string): T | null {
  try {
    const allData = JSON.parse(localStorage.getItem(key) || '{}')
    return allData[id] || null
  } catch {
    return null
  }
}

export function setStoredItem<T>(key: string, id: string, value: T) {
  const allData = JSON.parse(localStorage.getItem(key) || '{}')
  allData[id] = value
  localStorage.setItem(key, JSON.stringify(allData))
}
