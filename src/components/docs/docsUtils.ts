export const getSnippet = (content: string, query: string) => {
  if (!query || !query.trim()) return ''
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1)
    return content.slice(0, 100) + (content.length > 100 ? '...' : '')

  const start = Math.max(0, index - 40)
  const end = Math.min(content.length, index + query.length + 80)

  let snippet = content.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  return snippet
}
