/* Markdown Parser Utility for Docs Hub */

/**
 * Escapes HTML characters to prevent XSS in rendered content
 */
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Syntax highlighter for code blocks
 */
const highlightCode = (code: string, lang: string) => {
  let html = escapeHtml(code)

  // Common keywords for JS, TS, Python, SQL, etc.
  const keywords =
    /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|interface|type|async|await|new|this|try|catch|finally|switch|case|break|continue|default|typeof|instanceof|void|delete|in|of|extends|implements|package|private|protected|public|static|super|throw|throws|def|class|print|None|True|False|select|insert|update|delete|where|from|join|on|group|by|order|limit)\b/g

  // Highlighting rules
  html = html
    .replace(
      keywords,
      '<span class="text-purple-600 dark:text-purple-400 font-medium">$1</span>',
    )
    .replace(
      /(['"`])(.*?)\1/g,
      '<span class="text-green-600 dark:text-green-400">$1$2$1</span>',
    ) // Strings
    .replace(
      /\b(\d+)\b/g,
      '<span class="text-orange-600 dark:text-orange-400">$1</span>',
    ) // Numbers
    .replace(/(\/\/.*$|#.*$)/gm, '<span class="text-gray-500 italic">$1</span>') // Comments

  return html
}

/**
 * Parses inline markdown (bold, italic, links, etc.)
 */
const parseInline = (text: string): string => {
  return (
    text
      // Images
      .replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4 border" />',
      )
      // Links
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" class="text-primary hover:underline font-medium">$1</a>',
      )
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Inline Code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">$1</code>',
      )
  )
}

/**
 * Main parser function
 */
export function parseMarkdown(text: string): string {
  const lines = text.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimLine = line.trim()

    // 1. Code Blocks
    if (trimLine.startsWith('```')) {
      const lang = trimLine.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      const code = codeLines.join('\n')
      const highlighted = highlightCode(code, lang)
      output.push(
        `<pre class="bg-muted/50 p-4 rounded-lg my-4 overflow-x-auto border"><code class="text-sm font-mono language-${lang}">${highlighted}</code></pre>`,
      )
      i++
      continue
    }

    // 2. Tables (GFM Style)
    if (
      trimLine.startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|')
    ) {
      // Check if second line is a separator
      const nextLine = lines[i + 1].trim()
      const isTable =
        /^\|[-:| ]+\|$/.test(nextLine.replace(/[-:| ]/g, '')) ||
        nextLine.includes('---')

      if (isTable) {
        const headers = trimLine
          .split('|')
          .filter((c) => c)
          .map((c) => c.trim())
        const alignments = nextLine
          .split('|')
          .filter((c) => c)
          .map((c) => {
            const s = c.trim()
            if (s.startsWith(':') && s.endsWith(':')) return 'center'
            if (s.endsWith(':')) return 'right'
            return 'left'
          })

        let tableHtml =
          '<div class="my-4 w-full overflow-y-auto border rounded-md"><table class="w-full caption-bottom text-sm">'

        // Header
        tableHtml +=
          '<thead class="[&_tr]:border-b"><tr class="border-b bg-muted/50 transition-colors">'
        headers.forEach((h, idx) => {
          const align = alignments[idx] || 'left'
          tableHtml += `<th class="h-12 px-4 text-${align} align-middle font-medium text-muted-foreground">${parseInline(h)}</th>`
        })
        tableHtml += '</tr></thead><tbody>'

        i += 2
        // Body
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const cells = lines[i]
            .trim()
            .split('|')
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
          tableHtml +=
            '<tr class="border-b transition-colors hover:bg-muted/50 last:border-0">'
          cells.forEach((c, idx) => {
            const align = alignments[idx] || 'left'
            tableHtml += `<td class="p-4 align-middle text-${align}">${parseInline(c.trim())}</td>`
          })
          tableHtml += '</tr>'
          i++
        }
        tableHtml += '</tbody></table></div>'
        output.push(tableHtml)
        continue
      }
    }

    // 3. Task Lists
    const taskMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.*)/)
    if (taskMatch) {
      let listHtml = '<ul class="my-2 list-none pl-0 space-y-1">'
      while (i < lines.length) {
        const match = lines[i].match(/^(\s*)-\s+\[([ xX])\]\s+(.*)/)
        if (!match) break

        const isChecked = match[2].toLowerCase() === 'x'
        const content = parseInline(match[3])
        listHtml += `
          <li class="flex items-start gap-2">
            <input type="checkbox" class="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary" ${isChecked ? 'checked' : ''} disabled />
            <span class="${isChecked ? 'line-through text-muted-foreground' : ''}">${content}</span>
          </li>`
        i++
      }
      listHtml += '</ul>'
      output.push(listHtml)
      continue
    }

    // 4. Standard Lists
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/)
    if (listMatch) {
      const isOrdered = /^\d+\./.test(listMatch[2])
      const tag = isOrdered ? 'ol' : 'ul'
      const listClass = isOrdered ? 'list-decimal' : 'list-disc'
      let listHtml = `<${tag} class="my-2 pl-6 ${listClass} space-y-1">`

      while (i < lines.length) {
        const match = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)/)
        if (!match || /^\d+\./.test(match[2]) !== isOrdered) break

        listHtml += `<li>${parseInline(match[3])}</li>`
        i++
      }
      listHtml += `</${tag}>`
      output.push(listHtml)
      continue
    }

    // 5. Blockquotes
    if (trimLine.startsWith('>')) {
      let quoteHtml =
        '<blockquote class="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">'
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteHtml += parseInline(lines[i].replace(/^>\s?/, '')) + '<br/>'
        i++
      }
      quoteHtml += '</blockquote>'
      output.push(quoteHtml)
      continue
    }

    // 6. Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const sizeClasses = {
        1: 'text-3xl font-bold mt-8 mb-4 tracking-tight',
        2: 'text-2xl font-semibold mt-6 mb-3 tracking-tight',
        3: 'text-xl font-medium mt-4 mb-2',
        4: 'text-lg font-medium mt-3 mb-2',
        5: 'text-base font-medium mt-2 mb-1',
        6: 'text-sm font-medium mt-2 mb-1 uppercase text-muted-foreground',
      }
      output.push(
        `<h${level} class="${sizeClasses[level as keyof typeof sizeClasses]}">${parseInline(headerMatch[2])}</h${level}>`,
      )
      i++
      continue
    }

    // 7. Horizontal Rule
    if (/^[-*_]{3,}$/.test(trimLine)) {
      output.push('<hr class="my-6 border-muted" />')
      i++
      continue
    }

    // 8. Paragraphs
    if (trimLine.length > 0) {
      output.push(
        `<p class="leading-7 mb-4 [&:not(:first-child)]:mt-4">${parseInline(line)}</p>`,
      )
    } else {
      // Preserve empty lines slightly
      output.push('<div class="h-2"></div>')
    }

    i++
  }

  return output.join('\n')
}
