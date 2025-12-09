import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IdeaReferenceLink } from '@/types'
import { Link as LinkIcon, Plus, Trash2, ExternalLink } from 'lucide-react'

interface IdeaLinkedDocsProps {
  initialLinks: IdeaReferenceLink[]
  onChange: (links: IdeaReferenceLink[]) => void
}

export function IdeaLinkedDocs({
  initialLinks,
  onChange,
}: IdeaLinkedDocsProps) {
  const [links, setLinks] = useState<IdeaReferenceLink[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    setLinks(initialLinks)
  }, [initialLinks])

  const addLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    const newLink: IdeaReferenceLink = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle,
      url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
    }
    const updatedLinks = [...links, newLink]
    setLinks(updatedLinks)
    onChange(updatedLinks)
    setNewTitle('')
    setNewUrl('')
  }

  const removeLink = (id: string) => {
    const updatedLinks = links.filter((l) => l.id !== id)
    setLinks(updatedLinks)
    onChange(updatedLinks)
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Documentos Vinculados</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid gap-2">
          <Input
            placeholder="Título do documento (ex: Figma, Notion)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="URL (https://...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
            />
            <Button
              size="icon"
              onClick={addLink}
              disabled={!newTitle.trim() || !newUrl.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-2 rounded-md border bg-muted/20 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-1.5 bg-background rounded border">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {link.title}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground truncate hover:underline text-blue-500"
                  >
                    {link.url}
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeLink(link.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 italic">
              Nenhum documento vinculado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
