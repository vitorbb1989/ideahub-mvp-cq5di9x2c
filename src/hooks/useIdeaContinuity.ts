import { useState, useEffect, useCallback } from 'react'
import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaSnapshot,
  IdeaTimelineEvent,
  IdeaAttachment,
} from '@/types'
import { ideaService } from '@/services/ideaService'
import { useToast } from '@/hooks/use-toast'

export function useIdeaContinuity(ideaId: string | undefined) {
  const [lastState, setLastState] = useState<IdeaLastState | null>(null)
  const [checklist, setChecklist] = useState<IdeaChecklistItem[]>([])
  const [references, setReferences] = useState<IdeaReferenceLink[]>([])
  const [attachments, setAttachments] = useState<IdeaAttachment[]>([])
  const [snapshots, setSnapshots] = useState<IdeaSnapshot[]>([])
  const [events, setEvents] = useState<IdeaTimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const refreshData = useCallback(async () => {
    if (!ideaId) return
    try {
      const [cl, sn, ev, rs, rf, at] = await Promise.all([
        ideaService.getChecklist(ideaId),
        ideaService.getSnapshots(ideaId),
        ideaService.getTimelineEvents(ideaId),
        ideaService.getLastState(ideaId),
        ideaService.getReferences(ideaId),
        ideaService.getAttachments(ideaId),
      ])
      setChecklist(cl)
      setSnapshots(sn)
      setEvents(ev)
      setLastState(rs)
      setReferences(rf)
      setAttachments(at)
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
      const ev = await ideaService.getTimelineEvents(ideaId)
      setEvents(ev)
    }, 2000)
    return () => clearInterval(interval)
  }, [ideaId])

  // Checklists
  const addChecklistItem = async (label: string) => {
    if (!ideaId) return
    await ideaService.addChecklistItem(ideaId, label)
    await refreshData()
  }

  const toggleChecklistItem = async (itemId: string, done: boolean) => {
    if (!ideaId) return
    await ideaService.updateChecklistItem(ideaId, itemId, { done })
    await refreshData()
  }

  const removeChecklistItem = async (itemId: string) => {
    if (!ideaId) return
    await ideaService.removeChecklistItem(ideaId, itemId)
    await refreshData()
  }

  // Attachments
  const addAttachment = async (file: File) => {
    if (!ideaId) return
    try {
      await ideaService.addAttachment(ideaId, file)
      await refreshData()
      toast({
        title: 'Arquivo anexado!',
        description: `O arquivo ${file.name} foi salvo com sucesso.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao anexar',
        description:
          error instanceof Error
            ? error.message
            : 'Falha ao processar o arquivo.',
      })
      throw error // Re-throw to handle loading states in UI
    }
  }

  const removeAttachment = async (attachmentId: string) => {
    if (!ideaId) return
    await ideaService.removeAttachment(ideaId, attachmentId)
    await refreshData()
    toast({
      title: 'Arquivo removido',
      description: 'O anexo foi excluído com sucesso.',
    })
  }

  // Snapshots
  const createSnapshot = async (snapshot: IdeaSnapshot) => {
    if (!ideaId) return
    await ideaService.createSnapshot(ideaId, snapshot)
    await refreshData()
  }

  const updateSnapshot = async (snapshotId: string, title: string) => {
    if (!ideaId) return
    await ideaService.updateSnapshot(ideaId, snapshotId, { title })
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
        promises.push(ideaService.saveLastState(ideaId, newState))
      }
      promises.push(ideaService.saveReferences(ideaId, newReferences))
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
    attachments,
    snapshots,
    events,
    isLoading,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    addAttachment,
    removeAttachment,
    createSnapshot,
    updateSnapshot,
    saveStateAndReferences,
    refreshData,
  }
}
