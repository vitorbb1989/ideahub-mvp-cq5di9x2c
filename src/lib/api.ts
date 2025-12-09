import { Idea, IdeaStatus, Tag, IdeaEvent, User } from '@/types'

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Mock Data keys for LocalStorage
const STORAGE_KEYS = {
  IDEAS: 'ideahub_ideas',
  TAGS: 'ideahub_tags',
  EVENTS: 'ideahub_events',
  USERS: 'ideahub_users',
  SESSION: 'ideahub_session',
}

// Initial Mock Data
const INITIAL_TAGS: Tag[] = [
  { id: 't1', name: 'frontend' },
  { id: 't2', name: 'backend' },
  { id: 't3', name: 'mobile' },
  { id: 't4', name: 'ux' },
]

// Simulate API Latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class MockApi {
  private getStored<T>(key: string, initial: T): T {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch (e) {
      console.error('LocalStorage read error:', e)
      return initial
    }
  }

  private setStored<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('LocalStorage write error:', e)
      throw new Error('Falha ao salvar dados. Armazenamento cheio?')
    }
  }

  // --- Auth Methods ---

  async login(email: string, password: string): Promise<User> {
    await delay(500)
    const users = this.getStored<
      (User & { password: string; createdAt: string })[]
    >(STORAGE_KEYS.USERS, [])
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      throw new Error('Credenciais inválidas.')
    }

    const publicUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    }
    this.setStored(STORAGE_KEYS.SESSION, publicUser)
    return publicUser
  }

  async register(name: string, email: string, password: string): Promise<User> {
    await delay(500)
    const users = this.getStored<
      (User & { password: string; createdAt: string })[]
    >(STORAGE_KEYS.USERS, [])

    if (users.some((u) => u.email === email)) {
      throw new Error('E-mail já cadastrado.')
    }

    const newUser = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    this.setStored(STORAGE_KEYS.USERS, users)

    const publicUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    }
    this.setStored(STORAGE_KEYS.SESSION, publicUser)
    return publicUser
  }

  async logout() {
    await delay(200)
    localStorage.removeItem(STORAGE_KEYS.SESSION)
  }

  async getCurrentUser(): Promise<User | null> {
    await delay(200)
    return this.getStored<User | null>(STORAGE_KEYS.SESSION, null)
  }

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; avatar?: string | null },
  ): Promise<User> {
    await delay(500)
    const users = this.getStored<
      (User & { password: string; createdAt: string })[]
    >(STORAGE_KEYS.USERS, [])
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error('Usuário não encontrado.')
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== users[index].email) {
      const emailExists = users.some(
        (u) => u.email === data.email && u.id !== userId,
      )
      if (emailExists) {
        throw new Error('Este e-mail já está em uso por outro usuário.')
      }
    }

    const updatedUser = { ...users[index], ...data }
    users[index] = updatedUser
    this.setStored(STORAGE_KEYS.USERS, users)

    const publicUser: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    }
    this.setStored(STORAGE_KEYS.SESSION, publicUser)
    return publicUser
  }

  async changePassword(
    userId: string,
    currentPass: string,
    newPass: string,
  ): Promise<void> {
    await delay(500)
    const users = this.getStored<
      (User & { password: string; createdAt: string })[]
    >(STORAGE_KEYS.USERS, [])
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error('Usuário não encontrado.')
    }

    if (users[index].password !== currentPass) {
      throw new Error('A senha atual está incorreta.')
    }

    users[index].password = newPass
    this.setStored(STORAGE_KEYS.USERS, users)
  }

  // --- Data Methods ---

  async getIdeas(
    userId: string,
    query?: string,
    status?: IdeaStatus,
    tagId?: string,
  ) {
    await delay(500)
    let ideas = this.getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])

    // Filter by User ID
    ideas = ideas.filter((i) => i.userId === userId)

    if (query) {
      const q = query.toLowerCase()
      ideas = ideas.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q),
      )
    }

    if (status) {
      ideas = ideas.filter((i) => i.status === status)
    }

    if (tagId) {
      ideas = ideas.filter((i) => i.tags.some((t) => t.id === tagId))
    }

    return ideas
  }

  async getIdea(id: string) {
    await delay(200)
    const ideas = this.getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
    return ideas.find((i) => i.id === id) || null
  }

  async createIdea(
    data: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>,
  ) {
    await delay(500)
    const ideas = this.getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
    const newIdea: Idea = {
      ...data,
      id: generateId(),
      priorityScore: Number((data.impact / data.effort).toFixed(2)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    ideas.unshift(newIdea)
    this.setStored(STORAGE_KEYS.IDEAS, ideas)

    // Log creation event
    this.logEvent(newIdea.id, null, newIdea.status)

    return newIdea
  }

  async updateIdea(id: string, updates: Partial<Idea>) {
    await delay(500)
    const ideas = this.getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
    const index = ideas.findIndex((i) => i.id === id)

    if (index === -1) throw new Error('Idea not found')

    const currentIdea = ideas[index]
    const updatedIdea = {
      ...currentIdea,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // Recalculate priority if impact or effort changes
    if (updates.impact || updates.effort) {
      const impact = updates.impact ?? currentIdea.impact
      const effort = updates.effort ?? currentIdea.effort
      updatedIdea.priorityScore = Number((impact / effort).toFixed(2))
    }

    // Log status change
    if (updates.status && updates.status !== currentIdea.status) {
      this.logEvent(id, currentIdea.status, updates.status)
    }

    ideas[index] = updatedIdea
    this.setStored(STORAGE_KEYS.IDEAS, ideas)
    return updatedIdea
  }

  async getTags() {
    await delay(300)
    return this.getStored<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS)
  }

  async createTag(name: string) {
    await delay(300)
    const tags = this.getStored<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS)
    const existing = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) return existing

    const newTag: Tag = { id: generateId(), name }
    tags.push(newTag)
    this.setStored(STORAGE_KEYS.TAGS, tags)
    return newTag
  }

  async getIdeaEvents(ideaId: string) {
    await delay(300)
    const events = this.getStored<IdeaEvent[]>(STORAGE_KEYS.EVENTS, [])
    return events
      .filter((e) => e.ideaId === ideaId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  private logEvent(
    ideaId: string,
    previousStatus: IdeaStatus | null,
    newStatus: IdeaStatus,
  ) {
    const events = this.getStored<IdeaEvent[]>(STORAGE_KEYS.EVENTS, [])
    const newEvent: IdeaEvent = {
      id: generateId(),
      ideaId,
      date: new Date().toISOString(),
      previousStatus,
      newStatus,
    }
    events.push(newEvent)
    this.setStored(STORAGE_KEYS.EVENTS, events)
  }
}

export const api = new MockApi()
