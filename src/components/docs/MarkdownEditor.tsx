import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const [previewHtml, setPreviewHtml] = useState('')

  // Simple Markdown Parser (Regex Based)
  const parseMarkdown = (text: string) => {
    let html = text
      // Headers
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-3xl font-bold mt-4 mb-2">$1</h1>',
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-2xl font-semibold mt-3 mb-2">$1</h2>',
      )
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-xl font-medium mt-2 mb-1">$1</h3>',
      )
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/__(.*?)__/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/_(.*?)_/gim, '<em>$1</em>')
      // Lists
      .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Blockquotes
      .replace(
        /^>\s+(.*$)/gim,
        '<blockquote class="border-l-4 border-primary/50 pl-4 italic my-2">$1</blockquote>',
      )
      // Code blocks
      .replace(
        /```([\s\S]*?)```/gim,
        '<pre class="bg-muted p-2 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>',
      )
      .replace(
        /`([^`]+)`/gim,
        '<code class="bg-muted px-1 rounded text-sm">$1</code>',
      )
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" class="text-primary hover:underline" target="_blank">$1</a>',
      )
      // Horizontal Rule
      .replace(/^---$/gim, '<hr class="my-4 border-muted" />')
      // Line breaks
      .replace(/\n/gim, '<br />')

    return html
  }

  useEffect(() => {
    setPreviewHtml(parseMarkdown(content))
  }, [content])

  return (
    <Tabs defaultValue="edit" className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 shrink-0">
        <TabsList className="h-9 my-2">
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Visualizar</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="edit" className="flex-1 mt-0 p-0 min-h-0 relative">
        <Textarea
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
