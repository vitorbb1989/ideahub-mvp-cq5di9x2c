import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIdeas } from '@/context/IdeaContext'
import { ideaStateApi } from '@/lib/ideaStateApi'
import {
  IdeaLastState,
  IdeaChecklistItem,
  IdeaReferenceLink,
  IdeaTimelineEvent,
  IdeaSnapshot,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LastSavedState } from '@/components/continuity/LastSavedState'
import { IdeaChecklist } from '@/components/continuity/IdeaChecklist'
import { IdeaLinkedDocs } from '@/components/continuity/IdeaLinkedDocs'
import { IdeaTimeline } from '@/components/continuity/IdeaTimeline'
import { ArrowLeft, Save, Camera, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ideas, isLoading: isIdeasLoading } = useIdeas()
  const { toast } = useToast()

  const idea = ideas.find((i) => i.id === id)

  // Continuity State
  const [lastState, setLastState] = useState<IdeaLastState | null>(null)
  const [checklist, setChecklist] = useState<IdeaChecklistItem[]>([])
  const [references, setReferences] = useState<IdeaReferenceLink[]>([])
  const [events, setEvents] = useState<IdeaTimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Pending changes state
  const [pendingLastState, setPendingLastState] =
    useState<IdeaLastState | null>(null)
  const [pendingChecklist, setPendingChecklist] = useState<IdeaChecklistItem[]>(
    [],
  )
  const [pendingReferences, setPendingReferences] = useState<
    IdeaReferenceLink[]
  >([])

  // Snapshot Dialog
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false)
  const [snapshotTitle, setSnapshotTitle] = useState('')

  useEffect(() => {
    const loadState = async () => {
      if (!id) return
      setIsLoading(true)
      try {
        const [ls, cl, rf, ev] = await Promise.all([
          ideaStateApi.getLastState(id),
          ideaStateApi.getChecklist(id),
          ideaStateApi.getReferences(id),
          ideaStateApi.getEvents(id),
        ])
        setLastState(ls)
        setChecklist(cl)
        setReferences(rf)
        setEvents(ev)

        // Init pending states
        setPendingLastState(ls)
        setPendingChecklist(cl)
        setPendingReferences(rf)
      } catch (error) {
        console.error('Failed to load idea state', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadState()
  }, [id])

  // Scroll to section logic
  useEffect(() => {
    if (!isLoading && location.hash === '#last-saved-state') {
      const el = document.getElementById('last-saved-state')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [isLoading])

  if (isIdeasLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Ideia não encontrada</h2>
        <Button onClick={() => navigate('/')}>Voltar para Inbox</Button>
      </div>
    )
  }

  const handleSaveState = async () => {
    if (!id) return

    const promises = []

    // Save Last State if present
    if (pendingLastState) {
      promises.push(ideaStateApi.saveLastState(id, pendingLastState))
    }

    // Explicitly save checklist and references again to ensure consistency
    promises.push(ideaStateApi.saveChecklist(id, pendingChecklist))
    promises.push(ideaStateApi.saveReferences(id, pendingReferences))

    // Detect changes for Events
    const hasLastStateChanged =
      JSON.stringify(lastState) !== JSON.stringify(pendingLastState)
    const hasChecklistChanged =
      JSON.stringify(checklist) !== JSON.stringify(pendingChecklist)
    const hasReferencesChanged =
      JSON.stringify(references) !== JSON.stringify(pendingReferences)

    if (hasLastStateChanged) {
      promises.push(ideaStateApi.logEvent(id, 'last_state_updated'))
    }

    if (hasChecklistChanged) {
      promises.push(ideaStateApi.logEvent(id, 'checklist_updated'))
    }

    if (hasReferencesChanged) {
      promises.push(ideaStateApi.logEvent(id, 'references_updated'))
    }

    try {
      await Promise.all(promises)

      // Refresh events
      const ev = await ideaStateApi.getEvents(id)
      setEvents(ev)

      // Update baselines
      setLastState(pendingLastState)
      setChecklist(pendingChecklist)
      setReferences(pendingReferences)

      toast({
        title: 'Progresso salvo!',
        description: 'Estado atual, checklist e referências foram salvos.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o progresso.',
      })
    }
  }

  const handleCreateSnapshot = async () => {
    if (!id || !snapshotTitle.trim()) return

    const snapshot: IdeaSnapshot = {
      id: Math.random().toString(36).substring(2, 9),
      title: snapshotTitle,
      createdAt: new Date().toISOString(),
      data: {
        ideaTitle: idea.title,
        ideaSummary: idea.summary,
        lastState: pendingLastState,
        checklist: pendingChecklist,
        references: pendingReferences,
      },
    }

    try {
      await ideaStateApi.createSnapshot(id, snapshot)
      await ideaStateApi.logEvent(id, 'snapshot_created', {
        snapshotId: snapshot.id,
      })

      // Refresh events
      const ev = await ideaStateApi.getEvents(id)
      setEvents(ev)

      toast({
        title: 'Snapshot criado!',
        description: `Snapshot "${snapshotTitle}" salvo com sucesso.`,
      })
      setIsSnapshotOpen(false)
      setSnapshotTitle('')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar snapshot',
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {idea.title}
              </h1>
              <StatusBadge status={idea.status} />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {idea.summary}
            </p>
            <div className="flex gap-2 pt-2">
              {idea.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsSnapshotOpen(true)}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Snapshot
            </Button>
            <Button onClick={handleSaveState} className="gap-2">
              <Save className="w-4 h-4" />
              Salvar Estado
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Last Saved State - Prominent */}
          <section id="last-saved-state" className="scroll-mt-24">
            <LastSavedState
              initialState={lastState}
              onChange={setPendingLastState}
            />
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Checklist */}
            <IdeaChecklist
              initialItems={checklist}
              onChange={(items) => {
                setPendingChecklist(items)
                if (id) {
                  ideaStateApi.saveChecklist(id, items).catch(console.error)
                }
              }}
            />

            {/* References */}
            <IdeaLinkedDocs
              initialLinks={references}
              onChange={(links) => {
                setPendingReferences(links)
                if (id) {
                  ideaStateApi.saveReferences(id, links).catch(console.error)
                }
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* History */}
          <IdeaTimeline events={events} />
        </div>
      </div>

      {/* Snapshot Dialog */}
      <Dialog open={isSnapshotOpen} onOpenChange={setIsSnapshotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Snapshot</DialogTitle>
            <DialogDescription>
              Salve uma versão estática do estado atual da ideia para referência
              futura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="snapshot-title">Nome do Snapshot</Label>
              <Input
                id="snapshot-title"
                placeholder="Ex: Versão Alpha 1.0"
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSnapshotOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSnapshot} disabled={!snapshotTitle}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
