import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DocFile } from '@/types'
import { FileText, Link as LinkIcon, Plus, Trash2, Eye } from 'lucide-react'
import { useDocs } from '@/context/DocsContext'
import { DocumentPicker } from '@/components/docs/DocumentPicker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownEditor } from '@/components/docs/MarkdownEditor'

interface IdeaLinkedInternalDocsProps {
  ideaId: string
}

export function IdeaLinkedInternalDocs({
  ideaId,
}: IdeaLinkedInternalDocsProps) {
  const { linkDocToIdea, unlinkDocFromIdea, getIdeaDocs } = useDocs()
  const [docs, setDocs] = useState<DocFile[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocFile | null>(null)

  const refresh = async () => {
    const d = await getIdeaDocs(ideaId)
    setDocs(d)
  }

  useEffect(() => {
    refresh()
  }, [ideaId])

  const handleLink = async (docId: string) => {
    await linkDocToIdea(ideaId, docId)
    await refresh()
  }

  const handleUnlink = async (docId: string) => {
    if (confirm('Desvincular documento?')) {
      await unlinkDocFromIdea(ideaId, docId)
      await refresh()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Documentações Vinculadas</CardTitle>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPickerOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Vincular
        </Button>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 italic bg-muted/20 rounded-md">
            Nenhuma documentação interna vinculada.
          </p>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/20 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium truncate">{doc.name}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleUnlink(doc.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <DocumentPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleLink}
        excludeIds={docs.map((d) => d.id)}
      />

      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 border rounded-md overflow-hidden">
            {previewDoc && (
              <MarkdownEditor
                content={previewDoc.content}
                onChange={() => {}}
                readOnly
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
