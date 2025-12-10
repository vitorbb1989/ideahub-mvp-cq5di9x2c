import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IdeaSnapshot } from '@/types'
import { Camera, Edit2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface IdeaSnapshotsProps {
  snapshots: IdeaSnapshot[]
  onUpdate: (id: string, title: string) => Promise<void>
}

export function IdeaSnapshots({ snapshots, onUpdate }: IdeaSnapshotsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [selectedSnapshot, setSelectedSnapshot] = useState<IdeaSnapshot | null>(
    null,
  )

  const startEditing = (snapshot: IdeaSnapshot) => {
    setEditingId(snapshot.id)
    setEditTitle(snapshot.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const saveEditing = async (id: string) => {
    if (editTitle.trim()) {
      await onUpdate(id, editTitle)
    }
    setEditingId(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Snapshots</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            Nenhum snapshot criado.
          </p>
        ) : (
          snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex items-center justify-between p-2 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-2">
                {editingId === snapshot.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => saveEditing(snapshot.id)}
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={cancelEditing}
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium truncate text-foreground hover:text-primary"
                            onClick={() => setSelectedSnapshot(snapshot)}
                          >
                            {snapshot.title}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Camera className="w-5 h-5" />
                              {snapshot.title}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                              Criado em{' '}
                              {format(
                                new Date(snapshot.createdAt),
                                "dd 'de' MMM 'às' HH:mm",
                                { locale: ptBR },
                              )}
                            </p>
                          </DialogHeader>
                          <div className="space-y-6 pt-4">
                            <div>
                              <h4 className="font-semibold mb-2">
                                Resumo da Ideia
                              </h4>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                {snapshot.data.ideaSummary}
                              </p>
                            </div>

                            {snapshot.data.lastState && (
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Estado Salvo
                                </h4>
                                <div className="grid gap-2 text-sm border p-3 rounded-md">
                                  <div>
                                    <span className="font-medium">
                                      Onde parei:
                                    </span>{' '}
                                    {snapshot.data.lastState.whereIStopped}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      O que fazia:
                                    </span>{' '}
                                    {snapshot.data.lastState.whatIWasDoing}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Próximo passo:
                                    </span>{' '}
                                    {snapshot.data.lastState.nextStep}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold mb-2">
                                Checklist (
                                {
                                  snapshot.data.checklist.filter((i) => i.done)
                                    .length
                                }
                                /{snapshot.data.checklist.length})
                              </h4>
                              <div className="space-y-1">
                                {snapshot.data.checklist.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <div
                                      className={cn(
                                        'w-4 h-4 rounded border flex items-center justify-center',
                                        item.done
                                          ? 'bg-primary border-primary'
                                          : 'border-muted-foreground',
                                      )}
                                    >
                                      {item.done && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        item.done &&
                                          'line-through text-muted-foreground',
                                      )}
                                    >
                                      {item.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(snapshot.createdAt),
                        'dd/MM/yyyy HH:mm',
                        { locale: ptBR },
                      )}
                    </span>
                  </div>
                )}
              </div>

              {editingId !== snapshot.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => startEditing(snapshot)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
