import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IdeaAttachment } from '@/types'
import {
  Paperclip,
  Upload,
  Trash2,
  File as FileIcon,
  FileImage,
  FileText,
  Download,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface IdeaAttachmentsProps {
  attachments: IdeaAttachment[]
  onAdd: (file: File) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function IdeaAttachments({
  attachments,
  onAdd,
  onRemove,
}: IdeaAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await onAdd(file)
    } catch (error) {
      // Error is already logged and toasted by hook, but we catch to stop loading state
      console.error('Upload failed', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getIcon = (type: string) => {
    if (type.startsWith('image/'))
      return <FileImage className="w-8 h-8 text-blue-500" />
    if (type === 'application/pdf')
      return <FileText className="w-8 h-8 text-red-500" />
    return <FileIcon className="w-8 h-8 text-gray-500" />
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleRemove = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este anexo?')) {
      await onRemove(id)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Arquivos Anexados</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            Anexar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 italic border-2 border-dashed rounded-md bg-muted/10">
            Nenhum arquivo anexado. Clique em "Anexar" para fazer upload.
          </p>
        ) : (
          attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors group bg-background"
            >
              {getIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate cursor-default"
                  title={file.name}
                >
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatSize(file.size)}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(file.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={file.url} download={file.name}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                  onClick={() => handleRemove(file.id)}
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
