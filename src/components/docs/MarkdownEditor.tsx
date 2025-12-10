import { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  CheckSquare,
  Table as TableIcon,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Eye,
  Edit3,
} from 'lucide-react'
import { parseMarkdown } from './markdownParser'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  content: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function MarkdownEditor({
  content,
  onChange,
  readOnly = false,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [previewHtml, setPreviewHtml] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (activeTab === 'preview') {
      setPreviewHtml(parseMarkdown(content))
    }
  }, [content, activeTab])

  const insertText = (before: string, after = '', defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end) || defaultText
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end)

    onChange(newText)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      )
    }, 0)
  }

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    title,
  }: {
    icon: any
    onClick: () => void
    title: string
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      title={title}
      disabled={readOnly}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between border-b px-2 shrink-0 bg-muted/20">
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          <ToolbarButton
            icon={Bold}
            onClick={() => insertText('**', '**', 'negrito')}
            title="Negrito"
          />
          <ToolbarButton
            icon={Italic}
            onClick={() => insertText('*', '*', 'itálico')}
            title="Itálico"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={Heading1}
            onClick={() => insertText('# ', '', 'Título')}
            title="Título 1"
          />
          <ToolbarButton
            icon={Heading2}
            onClick={() => insertText('## ', '', 'Subtítulo')}
            title="Título 2"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={List}
            onClick={() => insertText('- ', '', 'item')}
            title="Lista"
          />
          <ToolbarButton
            icon={CheckSquare}
            onClick={() => insertText('- [ ] ', '', 'tarefa')}
            title="Lista de Tarefas"
          />
          <ToolbarButton
            icon={Quote}
            onClick={() => insertText('> ', '', 'citação')}
            title="Citação"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={Code}
            onClick={() => insertText('```javascript\n', '\n```', 'code')}
            title="Bloco de Código"
          />
          <ToolbarButton
            icon={TableIcon}
            onClick={() =>
              insertText(
                '| Cabeçalho 1 | Cabeçalho 2 |\n|---|---|\n| Célula 1 | Célula 2 |',
                '',
                '',
              )
            }
            title="Tabela"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={LinkIcon}
            onClick={() => insertText('[', '](url)', 'texto')}
            title="Link"
          />
          <ToolbarButton
            icon={ImageIcon}
            onClick={() => insertText('![', '](url)', 'descrição')}
            title="Imagem"
          />
        </div>

        <TabsList className="h-8 ml-2">
          <TabsTrigger value="edit" className="h-7 px-3 text-xs">
            <Edit3 className="w-3 h-3 mr-1.5" /> Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="h-7 px-3 text-xs">
            <Eye className="w-3 h-3 mr-1.5" /> Preview
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="edit"
        className="flex-1 mt-0 p-0 min-h-0 relative group"
      >
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full resize-none rounded-none border-0 focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed"
          placeholder="# Comece a escrever seu documento..."
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent
        value="preview"
        className="flex-1 mt-0 p-0 min-h-0 bg-background"
      >
        <ScrollArea className="h-full">
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-8"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
