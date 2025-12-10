import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIdeas } from '@/context/IdeaContext'
import { IdeaLastState, IdeaReferenceLink, IdeaSnapshot } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LastSavedState } from '@/components/continuity/LastSavedState'
import { IdeaChecklist } from '@/components/continuity/IdeaChecklist'
import { IdeaLinkedDocs } from '@/components/continuity/IdeaLinkedDocs'
import { IdeaLinkedInternalDocs } from '@/components/continuity/IdeaLinkedInternalDocs'
import { IdeaTimeline } from '@/components/continuity/IdeaTimeline'
import { IdeaSnapshots } from '@/components/continuity/IdeaSnapshots'
import { IdeaAttachments } from '@/components/continuity/IdeaAttachments'
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
import { useIdeaContinuity } from '@/hooks/useIdeaContinuity'

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ideas, isLoading: isIdeasLoading } = useIdeas()
  const { toast } = useToast()

  const idea = ideas.find((i) => i.id === id)

  const {
    lastState,
    checklist,
    references,
    attachments,
    snapshots,
    events,
    isLoading: isContinuityLoading,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    addAttachment,
    removeAttachment,
    createSnapshot,
    updateSnapshot,
    saveStateAndReferences,
  } = useIdeaContinuity(id)

  // Local Pending State (for user editing before save)
  const [pendingLastState, setPendingLastState] =
    useState<IdeaLastState | null>(null)
  const [pendingReferences, setPendingReferences] = useState<
    IdeaReferenceLink[]
  >([])

  // Snapshot Dialog State
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false)
  const [snapshotTitle, setSnapshotTitle] = useState('')

  // Sync initial state when loaded
  useEffect(() => {
    if (lastState) setPendingLastState(lastState)
  }, [lastState])

  useEffect(() => {
    if (references) setPendingReferences(references)
  }, [references])

  if (isIdeasLoading || isContinuityLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!idea || !id) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Ideia não encontrada</h2>
        <Button onClick={() => navigate('/')}>Voltar para Inbox</Button>
      </div>
    )
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
        checklist: checklist,
        references: pendingReferences,
        attachments: attachments,
      },
    }

    try {
      await createSnapshot(snapshot)
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

  const handleUpdateSnapshot = async (snapshotId: string, title: string) => {
    try {
      await updateSnapshot(snapshotId, title)
      toast({
        title: 'Snapshot atualizado',
        description: 'Título atualizado com sucesso.',
      })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar snapshot' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-fade-in">
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
            <Button
              onClick={() =>
                saveStateAndReferences(pendingLastState, pendingReferences)
              }
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Estado
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section id="last-saved-state" className="scroll-mt-24">
            <LastSavedState
              initialState={pendingLastState}
              onChange={setPendingLastState}
            />
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <IdeaChecklist
                items={checklist}
                onAdd={addChecklistItem}
                onToggle={toggleChecklistItem}
                onRemove={removeChecklistItem}
              />
              <IdeaSnapshots
                snapshots={snapshots}
                onUpdate={handleUpdateSnapshot}
              />
            </div>

            <div className="space-y-6">
              <IdeaLinkedInternalDocs ideaId={id} />
              <IdeaLinkedDocs
                initialLinks={pendingReferences}
                onChange={setPendingReferences}
              />
              <IdeaAttachments
                attachments={attachments}
                onAdd={addAttachment}
                onRemove={removeAttachment}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <IdeaTimeline events={events} />
        </div>
      </div>

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
