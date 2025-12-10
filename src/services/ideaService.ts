import {
  Idea,
  IdeaStatus,
  Tag,
  IdeaTimelineEvent,
  IdeaTimelineEventType,
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaAttachment,
  IdeaSnapshot,
  User,
} from '@/types'
import {
  STORAGE_KEYS,
  getStored,
  setStored,
  getStoredItem,
  setStoredItem,
  generateId,
} from './storage'

const INITIAL_TAGS: Tag[] = [
  { id: 't1', name: 'frontend' },
  { id: 't2', name: 'backend' },
  { id: 't3', name: 'mobile' },
  { id: 't4', name: 'ux' },
]

class IdeaService {
  // --- Security Helper ---
  private getCurrentUser(): User | null {
    return getStored<User | null>(STORAGE_KEYS.SESSION, null)
  }

  private checkOwnership(ownerId: string) {
    const user = this.getCurrentUser()
    if (!user) throw new Error('Usuário não autenticado.')
    if (user.id !== ownerId)
      throw new Error(
        'Acesso negado: Você não tem permissão para modificar este recurso.',
      )
    return user
  }

  // --- Core Idea CRUD ---

  async getIdeas(
    userId: string,
    query?: string,
    status?: IdeaStatus,
    tagId?: string,
  ) {
    // Security check: Only allow fetching own ideas or public (if implemented)
    // For now, we trust the caller to pass correct userId, but we could enforce checkOwnership(userId) here if we wanted strict mode.

    let ideas = getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])

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
    const ideas = getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
    const idea = ideas.find((i) => i.id === id) || null

    if (idea) {
      // Optional: Check ownership on read?
      // const user = this.getCurrentUser();
      // if (user && user.id !== idea.userId) return null;
    }
    return idea
  }

  async createIdea(
    data: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>,
  ) {
    // Ensure the creator is the logged in user
    this.checkOwnership(data.userId)

    const ideas = getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
    const newIdea: Idea = {
      ...data,
      id: generateId(),
      priorityScore: Number((data.impact / data.effort).toFixed(2)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    ideas.unshift(newIdea)
    setStored(STORAGE_KEYS.IDEAS, ideas)

    // Log creation event
    await this.logTimelineEvent(newIdea.id, 'status_changed', {
      oldStatus: null,
      newStatus: newIdea.status,
    })

    return newIdea
  }

  async updateIdea(id: string, updates: Partial<Idea>) {
    const ideas = getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
    const index = ideas.findIndex((i) => i.id === id)

    if (index === -1) throw new Error('Idea not found')

    // SECURITY CHECK: Verify ownership
    const currentIdea = ideas[index]
    this.checkOwnership(currentIdea.userId)

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

      // Log Priority Change
      if (updatedIdea.priorityScore !== currentIdea.priorityScore) {
        await this.logTimelineEvent(id, 'priority_updated', {
          oldPriority: currentIdea.priorityScore,
          newPriority: updatedIdea.priorityScore,
        })
      }
    }

    // Log status change
    if (updates.status && updates.status !== currentIdea.status) {
      await this.logTimelineEvent(id, 'status_changed', {
        oldStatus: currentIdea.status,
        newStatus: updates.status,
      })
    }

    // Log Tag Changes
    if (updates.tags) {
      const oldTags = currentIdea.tags.map((t) => t.name)
      const newTags = updates.tags.map((t) => t.name)

      const added = newTags.filter((t) => !oldTags.includes(t))
      const removed = oldTags.filter((t) => !newTags.includes(t))

      if (added.length > 0 || removed.length > 0) {
        await this.logTimelineEvent(id, 'tags_updated', { added, removed })
      }
    }

    ideas[index] = updatedIdea
    setStored(STORAGE_KEYS.IDEAS, ideas)
    return updatedIdea
  }

  // --- Tags ---

  async getTags() {
    return getStored<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS)
  }

  async createTag(name: string) {
    const tags = getStored<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS)
    const existing = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) return existing

    const newTag: Tag = { id: generateId(), name }
    tags.push(newTag)
    setStored(STORAGE_KEYS.TAGS, tags)
    return newTag
  }

  // --- Timeline ---

  async getTimelineEvents(ideaId: string): Promise<IdeaTimelineEvent[]> {
    const allEvents = getStored<Record<string, IdeaTimelineEvent[]>>(
      STORAGE_KEYS.TIMELINE_EVENTS,
      {},
    )
    return (allEvents[ideaId] || []).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  async logTimelineEvent(
    ideaId: string,
    type: IdeaTimelineEventType,
    payload: Record<string, any>,
  ) {
    try {
      const allEvents = getStored<Record<string, IdeaTimelineEvent[]>>(
        STORAGE_KEYS.TIMELINE_EVENTS,
        {},
      )
      const events = allEvents[ideaId] || []

      events.unshift({
        id: generateId(),
        type,
        createdAt: new Date().toISOString(),
        payload,
      })

      allEvents[ideaId] = events
      setStored(STORAGE_KEYS.TIMELINE_EVENTS, allEvents)
    } catch (e) {
      console.error('Failed to log timeline event', e)
    }
  }

  // --- Last State ---

  async getLastState(ideaId: string): Promise<IdeaLastState | null> {
    return getStoredItem<IdeaLastState>(STORAGE_KEYS.LAST_STATES, ideaId)
  }

  async saveLastState(ideaId: string, newState: IdeaLastState): Promise<void> {
    // Check ownership implicitly via getIdea logic or enforce here
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const oldState = getStoredItem<IdeaLastState>(
      STORAGE_KEYS.LAST_STATES,
      ideaId,
    )

    // Diff Logic
    if (oldState) {
      const changes: any[] = []
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
        await this.logTimelineEvent(ideaId, 'last_state_updated', { changes })
      }
    } else {
      // First save
      await this.logTimelineEvent(ideaId, 'last_state_updated', {
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

    setStoredItem(STORAGE_KEYS.LAST_STATES, ideaId, newState)
  }

  // --- Checklist Operations ---

  async getChecklist(ideaId: string): Promise<IdeaChecklistItem[]> {
    return (
      getStoredItem<IdeaChecklistItem[]>(STORAGE_KEYS.CHECKLISTS, ideaId) || []
    )
  }

  async addChecklistItem(
    ideaId: string,
    label: string,
  ): Promise<IdeaChecklistItem> {
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const items = (await this.getChecklist(ideaId)) || []
    const newItem: IdeaChecklistItem = {
      id: generateId(),
      label,
      done: false,
    }
    const updatedItems = [...items, newItem]
    setStoredItem(STORAGE_KEYS.CHECKLISTS, ideaId, updatedItems)

    await this.logTimelineEvent(ideaId, 'checklist_updated', {
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
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const items = (await this.getChecklist(ideaId)) || []
    const index = items.findIndex((i) => i.id === itemId)
    if (index === -1) return

    const original = items[index]
    const updated = { ...original, ...updates }
    items[index] = updated

    setStoredItem(STORAGE_KEYS.CHECKLISTS, ideaId, items)

    const change = original.done !== updated.done ? 'status' : 'label'
    await this.logTimelineEvent(ideaId, 'checklist_updated', {
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
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const items = (await this.getChecklist(ideaId)) || []
    const itemToRemove = items.find((i) => i.id === itemId)
    if (!itemToRemove) return

    const updatedItems = items.filter((i) => i.id !== itemId)
    setStoredItem(STORAGE_KEYS.CHECKLISTS, ideaId, updatedItems)

    await this.logTimelineEvent(ideaId, 'checklist_updated', {
      added: [],
      removed: [itemToRemove],
      updated: [],
    })
  }

  // --- References Operations ---

  async getReferences(ideaId: string): Promise<IdeaReferenceLink[]> {
    return (
      getStoredItem<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) || []
    )
  }

  async saveReferences(
    ideaId: string,
    newLinks: IdeaReferenceLink[],
  ): Promise<void> {
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const oldLinks =
      getStoredItem<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) || []

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
      await this.logTimelineEvent(ideaId, 'references_updated', {
        added,
        removed,
        updated,
      })
    }

    setStoredItem(STORAGE_KEYS.REFERENCES, ideaId, newLinks)
  }

  // --- Attachments Operations ---

  async getAttachments(ideaId: string): Promise<IdeaAttachment[]> {
    return (
      getStoredItem<IdeaAttachment[]>(STORAGE_KEYS.ATTACHMENTS, ideaId) || []
    )
  }

  async addAttachment(ideaId: string, file: File): Promise<IdeaAttachment> {
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    // 1MB Limit for LocalStorage safety
    if (file.size > 1024 * 1024) {
      throw new Error(
        'O arquivo excede o limite de 1MB. Por favor, utilize arquivos menores.',
      )
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const attachments = (await this.getAttachments(ideaId)) || []
          const newAttachment: IdeaAttachment = {
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: reader.result as string,
            createdAt: new Date().toISOString(),
          }

          const updatedAttachments = [...attachments, newAttachment]
          setStoredItem(STORAGE_KEYS.ATTACHMENTS, ideaId, updatedAttachments)

          await this.logTimelineEvent(ideaId, 'attachments_updated', {
            added: [newAttachment],
            removed: [],
          })

          resolve(newAttachment)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Falha ao ler arquivo.'))
      reader.readAsDataURL(file)
    })
  }

  async removeAttachment(ideaId: string, attachmentId: string): Promise<void> {
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const attachments = (await this.getAttachments(ideaId)) || []
    const toRemove = attachments.find((a) => a.id === attachmentId)
    if (!toRemove) return

    const updatedAttachments = attachments.filter((a) => a.id !== attachmentId)
    setStoredItem(STORAGE_KEYS.ATTACHMENTS, ideaId, updatedAttachments)

    await this.logTimelineEvent(ideaId, 'attachments_updated', {
      added: [],
      removed: [toRemove],
    })
  }

  // --- Snapshot Operations ---

  async getSnapshots(ideaId: string): Promise<IdeaSnapshot[]> {
    return getStoredItem<IdeaSnapshot[]>(STORAGE_KEYS.SNAPSHOTS, ideaId) || []
  }

  async createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void> {
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const snapshots = (await this.getSnapshots(ideaId)) || []
    snapshots.unshift(snapshot)
    setStoredItem(STORAGE_KEYS.SNAPSHOTS, ideaId, snapshots)

    await this.logTimelineEvent(ideaId, 'snapshot_created', {
      snapshotId: snapshot.id,
      title: snapshot.title,
    })
  }

  async updateSnapshot(
    ideaId: string,
    snapshotId: string,
    updates: { title: string },
  ): Promise<void> {
    const idea = await this.getIdea(ideaId)
    if (idea) this.checkOwnership(idea.userId)

    const snapshots = (await this.getSnapshots(ideaId)) || []
    const index = snapshots.findIndex((s) => s.id === snapshotId)
    if (index === -1) return

    snapshots[index] = { ...snapshots[index], ...updates }
    setStoredItem(STORAGE_KEYS.SNAPSHOTS, ideaId, snapshots)
  }
}

export const ideaService = new IdeaService()
