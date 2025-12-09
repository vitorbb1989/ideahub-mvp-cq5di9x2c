import { useState } from 'react'
import { useIdeas } from '@/context/IdeaContext'
import { IdeaStatus, STATUS_LABELS } from '@/types'
import { IdeaCard } from '@/components/IdeaCard'
import { IdeaModal } from '@/components/IdeaModal'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Define columns order
const COLUMNS: IdeaStatus[] = [
  'nova_ideia',
  'em_analise',
  'mvp',
  'backlog',
  'em_andamento',
  'entregue',
  'arquivada',
]

const Board = () => {
  const { ideas, updateIdea, isLoading } = useIdeas()
  const { toast } = useToast()
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [modalStatus, setModalStatus] = useState<IdeaStatus | undefined>(
    undefined,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Drag and Drop State
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<IdeaStatus | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedIdeaId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDrop = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedIdeaId) {
      updateIdea(draggedIdeaId, { status })
      toast({
        title: 'Status atualizado',
        description: `Ideia movida para ${STATUS_LABELS[status]}`,
        duration: 2000,
      })
    }
    setDraggedIdeaId(null)
  }

  const openNewIdeaModal = (status: IdeaStatus) => {
    setSelectedIdeaId(null)
    setModalStatus(status)
    setIsModalOpen(true)
  }

  const openEditModal = (id: string) => {
    setSelectedIdeaId(id)
    setModalStatus(undefined)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedIdeaId(null)
    setModalStatus(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border bg-muted/30">
        <div className="flex h-full p-4 gap-4">
          {COLUMNS.map((status) => {
            const columnIdeas = ideas.filter((idea) => idea.status === status)

            return (
              <div
                key={status}
                className={cn(
                  'flex flex-col w-80 shrink-0 h-full rounded-lg border bg-muted/50 transition-colors',
                  dragOverColumn === status &&
                    'bg-primary/10 border-primary/50',
                )}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                onDragLeave={() => setDragOverColumn(null)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 border-b bg-background/50 rounded-t-lg">
                  <h3 className="font-semibold text-sm">
                    {STATUS_LABELS[status]}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {columnIdeas.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openNewIdeaModal(status)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-2 overflow-y-auto min-h-0 space-y-2">
                  {columnIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onClick={() => openEditModal(idea.id)}
                      isDraggable
                      onDragStart={handleDragStart}
                    />
                  ))}
                  {columnIdeas.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed rounded-lg border-muted-foreground/10 text-muted-foreground/50 text-xs">
                      Sem ideias
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <IdeaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        ideaId={selectedIdeaId}
        initialStatus={modalStatus}
      />
    </div>
  )
}

export default Board
