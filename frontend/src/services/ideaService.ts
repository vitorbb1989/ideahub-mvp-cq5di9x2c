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
import { apiCall } from '@/lib/apiMiddleware'
import { cacheService } from '@/lib/cache'

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
    // Cache key includes filters
    const cacheKey = `ideas-${userId}-${query || 'all'}-${status || 'all'}-${tagId || 'all'}`

    return apiCall(
      'GET /ideas',
      async () => {
        // Simulate Network Delay
        await new Promise((r) => setTimeout(r, 400))

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
      },
      { cacheKey, ttl: 30 }, // Cache for 30 seconds
    )
  }

  async getIdea(id: string) {
    return apiCall(
      `GET /ideas/${id}`,
      async () => {
        await new Promise((r) => setTimeout(r, 200))
        const ideas = getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
        return ideas.find((i) => i.id === id) || null
      },
      { cacheKey: `idea-${id}`, ttl: 60 },
    )
  }

  async createIdea(
    data: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>,
  ) {
    return apiCall('POST /ideas', async () => {
      this.checkOwnership(data.userId)
      await new Promise((r) => setTimeout(r, 500))

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

      // Invalidate list caches
      cacheService.invalidate('ideas-')

      await this.logTimelineEvent(newIdea.id, 'status_changed', {
        oldStatus: null,
        newStatus: newIdea.status,
      })

      return newIdea
    })
  }

  async updateIdea(id: string, updates: Partial<Idea>) {
    return apiCall(`PATCH /ideas/${id}`, async () => {
      await new Promise((r) => setTimeout(r, 300))

      const ideas = getStored<Idea[]>(STORAGE_KEYS.IDEAS, [])
      const index = ideas.findIndex((i) => i.id === id)

      if (index === -1) throw new Error('Idea not found')

      const currentIdea = ideas[index]
      this.checkOwnership(currentIdea.userId)

      const updatedIdea = {
        ...currentIdea,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      if (updates.impact || updates.effort) {
        const impact = updates.impact ?? currentIdea.impact
        const effort = updates.effort ?? currentIdea.effort
        updatedIdea.priorityScore = Number((impact / effort).toFixed(2))

        if (updatedIdea.priorityScore !== currentIdea.priorityScore) {
          await this.logTimelineEvent(id, 'priority_updated', {
            oldPriority: currentIdea.priorityScore,
            newPriority: updatedIdea.priorityScore,
          })
        }
      }

      if (updates.status && updates.status !== currentIdea.status) {
        await this.logTimelineEvent(id, 'status_changed', {
          oldStatus: currentIdea.status,
          newStatus: updates.status,
        })
      }

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

      // Invalidate specific cache and lists
      cacheService.invalidate(`idea-${id}`)
      cacheService.invalidate('ideas-')

      return updatedIdea
    })
  }

  // --- Tags ---

  async getTags() {
    return apiCall(
      'GET /tags',
      async () => {
        return getStored<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS)
      },
      { cacheKey: 'tags', ttl: 300 },
    )
  }

  async createTag(name: string) {
    return apiCall('POST /tags', async () => {
      const tags = getStored<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS)
      const existing = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase(),
      )
      if (existing) return existing

      const newTag: Tag = { id: generateId(), name }
      tags.push(newTag)
      setStored(STORAGE_KEYS.TAGS, tags)

      cacheService.invalidate('tags')
      return newTag
    })
  }

  // --- Timeline ---

  async getTimelineEvents(ideaId: string): Promise<IdeaTimelineEvent[]> {
    return apiCall(
      `GET /ideas/${ideaId}/timeline`,
      async () => {
        const allEvents = getStored<Record<string, IdeaTimelineEvent[]>>(
          STORAGE_KEYS.TIMELINE_EVENTS,
          {},
        )
        return (allEvents[ideaId] || []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      },
      { cacheKey: `timeline-${ideaId}`, ttl: 10 },
    )
  }

  async logTimelineEvent(
    ideaId: string,
    type: IdeaTimelineEventType,
    payload: Record<string, any>,
  ) {
    // Internal method, not wrapped in public API call usually, but we log it
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
      cacheService.invalidate(`timeline-${ideaId}`)
    } catch (e) {
      console.error('Failed to log timeline event', e)
    }
  }

  // --- Last State ---

  async getLastState(ideaId: string): Promise<IdeaLastState | null> {
    return apiCall(`GET /ideas/${ideaId}/state`, async () => {
      return getStoredItem<IdeaLastState>(STORAGE_KEYS.LAST_STATES, ideaId)
    })
  }

  async saveLastState(ideaId: string, newState: IdeaLastState): Promise<void> {
    return apiCall(`PUT /ideas/${ideaId}/state`, async () => {
      // Check ownership implicitly via getIdea logic or enforce here
      const idea = await this.getIdea(ideaId)
      if (idea) this.checkOwnership(idea.userId)

      const oldState = getStoredItem<IdeaLastState>(
        STORAGE_KEYS.LAST_STATES,
        ideaId,
      )

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
    })
  }

  // --- Checklist Operations ---

  async getChecklist(ideaId: string): Promise<IdeaChecklistItem[]> {
    return apiCall(`GET /ideas/${ideaId}/checklist`, async () => {
      return (
        getStoredItem<IdeaChecklistItem[]>(STORAGE_KEYS.CHECKLISTS, ideaId) ||
        []
      )
    })
  }

  async addChecklistItem(
    ideaId: string,
    label: string,
  ): Promise<IdeaChecklistItem> {
    return apiCall(`POST /ideas/${ideaId}/checklist`, async () => {
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
    })
  }

  async updateChecklistItem(
    ideaId: string,
    itemId: string,
    updates: Partial<IdeaChecklistItem>,
  ): Promise<void> {
    return apiCall(`PATCH /ideas/${ideaId}/checklist/${itemId}`, async () => {
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
    })
  }

  async removeChecklistItem(ideaId: string, itemId: string): Promise<void> {
    return apiCall(`DELETE /ideas/${ideaId}/checklist/${itemId}`, async () => {
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
    })
  }

  // --- References Operations ---

  async getReferences(ideaId: string): Promise<IdeaReferenceLink[]> {
    return apiCall(`GET /ideas/${ideaId}/references`, async () => {
      return (
        getStoredItem<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) ||
        []
      )
    })
  }

  async saveReferences(
    ideaId: string,
    newLinks: IdeaReferenceLink[],
  ): Promise<void> {
    return apiCall(`PUT /ideas/${ideaId}/references`, async () => {
      const idea = await this.getIdea(ideaId)
      if (idea) this.checkOwnership(idea.userId)

      const oldLinks =
        getStoredItem<IdeaReferenceLink[]>(STORAGE_KEYS.REFERENCES, ideaId) ||
        []

      // Diff Logic
      const added = newLinks.filter((n) => !oldLinks.find((o) => o.id === n.id))
      const removed = oldLinks.filter(
        (o) => !newLinks.find((n) => n.id === o.id),
      )
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
    })
  }

  // --- Attachments Operations ---

  async getAttachments(ideaId: string): Promise<IdeaAttachment[]> {
    return apiCall(`GET /ideas/${ideaId}/attachments`, async () => {
      return (
        getStoredItem<IdeaAttachment[]>(STORAGE_KEYS.ATTACHMENTS, ideaId) || []
      )
    })
  }

  async addAttachment(ideaId: string, file: File): Promise<IdeaAttachment> {
    return apiCall(`POST /ideas/${ideaId}/attachments`, async () => {
      const idea = await this.getIdea(ideaId)
      if (idea) this.checkOwnership(idea.userId)

      if (file.size > 1024 * 1024) {
        throw new Error(
          'O arquivo excede o limite de 1MB. Por favor, utilize arquivos menores.',
        )
      }

      return new Promise<IdeaAttachment>((resolve, reject) => {
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
    })
  }

  async removeAttachment(ideaId: string, attachmentId: string): Promise<void> {
    return apiCall(
      `DELETE /ideas/${ideaId}/attachments/${attachmentId}`,
      async () => {
        const idea = await this.getIdea(ideaId)
        if (idea) this.checkOwnership(idea.userId)

        const attachments = (await this.getAttachments(ideaId)) || []
        const toRemove = attachments.find((a) => a.id === attachmentId)
        if (!toRemove) return

        const updatedAttachments = attachments.filter(
          (a) => a.id !== attachmentId,
        )
        setStoredItem(STORAGE_KEYS.ATTACHMENTS, ideaId, updatedAttachments)

        await this.logTimelineEvent(ideaId, 'attachments_updated', {
          added: [],
          removed: [toRemove],
        })
      },
    )
  }

  // --- Snapshot Operations ---

  async getSnapshots(ideaId: string): Promise<IdeaSnapshot[]> {
    return apiCall(`GET /ideas/${ideaId}/snapshots`, async () => {
      return getStoredItem<IdeaSnapshot[]>(STORAGE_KEYS.SNAPSHOTS, ideaId) || []
    })
  }

  async createSnapshot(ideaId: string, snapshot: IdeaSnapshot): Promise<void> {
    return apiCall(`POST /ideas/${ideaId}/snapshots`, async () => {
      const idea = await this.getIdea(ideaId)
      if (idea) this.checkOwnership(idea.userId)

      const snapshots = (await this.getSnapshots(ideaId)) || []
      snapshots.unshift(snapshot)
      setStoredItem(STORAGE_KEYS.SNAPSHOTS, ideaId, snapshots)

      await this.logTimelineEvent(ideaId, 'snapshot_created', {
        snapshotId: snapshot.id,
        title: snapshot.title,
      })
    })
  }

  async updateSnapshot(
    ideaId: string,
    snapshotId: string,
    updates: { title: string },
  ): Promise<void> {
    return apiCall(
      `PATCH /ideas/${ideaId}/snapshots/${snapshotId}`,
      async () => {
        const idea = await this.getIdea(ideaId)
        if (idea) this.checkOwnership(idea.userId)

        const snapshots = (await this.getSnapshots(ideaId)) || []
        const index = snapshots.findIndex((s) => s.id === snapshotId)
        if (index === -1) return

        snapshots[index] = { ...snapshots[index], ...updates }
        setStoredItem(STORAGE_KEYS.SNAPSHOTS, ideaId, snapshots)
      },
    )
  }
}

export const ideaService = new IdeaService()
