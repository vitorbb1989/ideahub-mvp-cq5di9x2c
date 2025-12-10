import { useState, useEffect, useCallback } from 'react'
import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaSnapshot,
  IdeaTimelineEvent,
} from '@/types'
import { ideaStateApi } from '@/lib/ideaStateApi'
import { useToast } from '@/hooks/use-toast'

export function useIdeaContinuity(ideaId: string | undefined) {
  const [lastState, setLastState] = useState<IdeaLastState | null>(null)
  const [checklist, setChecklist] = useState<IdeaChecklistItem[]>([])
  const [references, setReferences] = useState<IdeaReferenceLink[]>([])
  const [snapshots, setSnapshots] = useState<IdeaSnapshot[]>([])
  const [events, setEvents] = useState<IdeaTimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const refreshData = useCallback(async () => {
    if (!ideaId) return
    try {
      const [cl, sn, ev, rs, rf] = await Promise.all([
        ideaStateApi.getChecklist(ideaId),
        ideaStateApi.getSnapshots(ideaId),
        ideaStateApi.getEvents(ideaId),
        ideaStateApi.getLastState(ideaId),
        ideaStateApi.getReferences(ideaId),
      ])
      setChecklist(cl)
      setSnapshots(sn)
      setEvents(ev)
      setLastState(rs)
      setReferences(rf)
    } catch (error) {
      console.error('Failed to refresh data', error)
    }
  }, [ideaId])

  useEffect(() => {
    const loadState = async () => {
      if (!ideaId) return
      setIsLoading(true)
      try {
        await refreshData()
      } catch (error) {
        console.error('Failed to load idea state', error)
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadState()
  }, [ideaId, refreshData, toast])

  // Poll for events
  useEffect(() => {
    if (!ideaId) return
    const interval = setInterval(async () => {
      const ev = await ideaStateApi.getEvents(ideaId)
      setEvents(ev)
    }, 2000)
    return () => clearInterval(interval)
  }, [ideaId])

  // Checklists
  const addChecklistItem = async (label: string) => {
    if (!ideaId) return
    await ideaStateApi.addChecklistItem(ideaId, label)
    await refreshData()
  }

  const toggleChecklistItem = async (itemId: string, done: boolean) => {
    if (!ideaId) return
    await ideaStateApi.updateChecklistItem(ideaId, itemId, { done })
    await refreshData()
  }

  const removeChecklistItem = async (itemId: string) => {
    if (!ideaId) return
    await ideaStateApi.removeChecklistItem(ideaId, itemId)
    await refreshData()
  }

  // Snapshots
  const createSnapshot = async (snapshot: IdeaSnapshot) => {
    if (!ideaId) return
    await ideaStateApi.createSnapshot(ideaId, snapshot)
    await refreshData()
  }

  const updateSnapshot = async (snapshotId: string, title: string) => {
    if (!ideaId) return
    await ideaStateApi.updateSnapshot(ideaId, snapshotId, { title })
    await refreshData()
  }

  // State & References (Batch Save)
  const saveStateAndReferences = async (
    newState: IdeaLastState | null,
    newReferences: IdeaReferenceLink[],
  ) => {
    if (!ideaId) return
    try {
      const promises = []
      if (newState) {
        promises.push(ideaStateApi.saveLastState(ideaId, newState))
      }
      promises.push(ideaStateApi.saveReferences(ideaId, newReferences))
      await Promise.all(promises)
      await refreshData()
      toast({
        title: 'Progresso salvo!',
        description: 'Estado e referências foram salvos.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o progresso.',
      })
    }
  }

  return {
    lastState,
    checklist,
    references,
    snapshots,
    events,
    isLoading,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    createSnapshot,
    updateSnapshot,
    saveStateAndReferences,
    refreshData,
  }
}
