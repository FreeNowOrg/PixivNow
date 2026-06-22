import type {
  NovelContentBlock,
  NovelInlineToken,
  NovelTextEmbeddedImage,
} from '~/types'

const blockMarkerPattern = /^\[(chapter|newpage|uploadedimage|pixivimage)(?::([^\]]*))?\]$/
const inlinePattern =
  /\[\[rb:([^>\]]+)\s*>\s*([^\]]+)\]\]|\[\[jumpuri:([^>\]]+)\s*>\s*([^\]]+)\]\]|\[\[emphasismark:([^>\]]+)\s*>\s*([^\]]+)\]\]|\[jump:(\d+)\]|\[b:([^\]]+)\]|\[i:([^\]]+)\]/g

function getEmbeddedImageUrl(image?: NovelTextEmbeddedImage): string | undefined {
  if (!image?.urls) return undefined
  return (
    image.urls.original ||
    image.urls.regular ||
    image.urls['1200x1200'] ||
    image.urls['480mw'] ||
    image.urls['240mw']
  )
}

function safeHref(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    return undefined
  }
}

function parseInline(text: string): NovelInlineToken[] {
  const tokens: NovelInlineToken[] = []
  let lastIndex = 0

  for (const match of text.matchAll(inlinePattern)) {
    if (match.index === undefined) continue
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[1] && match[2]) {
      tokens.push({ type: 'ruby', base: match[1].trim(), ruby: match[2].trim() })
    } else if (match[3] && match[4]) {
      const href = safeHref(match[4].trim())
      if (href) {
        tokens.push({ type: 'link', text: match[3].trim(), href })
      } else {
        tokens.push({ type: 'text', text: match[3].trim() })
      }
    } else if (match[5] && match[6]) {
      tokens.push({
        type: 'emphasis',
        text: match[5].trim(),
        mark: match[6].trim().slice(0, 1),
      })
    } else if (match[7]) {
      tokens.push({ type: 'jump', page: Number(match[7]) })
    } else if (match[8]) {
      tokens.push({ type: 'bold', inlines: parseInline(match[8].trim()) })
    } else if (match[9]) {
      tokens.push({ type: 'italic', inlines: parseInline(match[9].trim()) })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return tokens.length ? tokens : [{ type: 'text', text }]
}

export function parseNovelContent(
  content: string,
  embeddedImages?: Record<string, NovelTextEmbeddedImage> | null
): NovelContentBlock[] {
  const blocks: NovelContentBlock[] = []
  const paragraphs: string[] = []

  function flushParagraphs() {
    if (!paragraphs.length) return
    blocks.push({ type: 'paragraph', inlines: parseInline(paragraphs.join('\n')) })
    paragraphs.length = 0
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    const marker = line.trim().match(blockMarkerPattern)

    if (!line.trim()) {
      flushParagraphs()
      continue
    }

    if (!marker) {
      paragraphs.push(line)
      continue
    }

    flushParagraphs()
    const [, markerType, value = ''] = marker
    const markerValue = value.trim()

    if (markerType === 'chapter') {
      blocks.push({ type: 'chapter', title: markerValue })
    } else if (markerType === 'newpage') {
      blocks.push({ type: 'divider', label: markerValue || undefined })
    } else if (markerType === 'uploadedimage') {
      const src = getEmbeddedImageUrl(embeddedImages?.[markerValue])
      if (src) {
        blocks.push({
          type: 'uploadedImage',
          id: markerValue,
          src,
          alt: embeddedImages?.[markerValue]?.alt || `uploaded image ${markerValue}`,
        })
      } else {
        blocks.push({ type: 'pixivImage', id: markerValue })
      }
    } else if (markerType === 'pixivimage') {
      blocks.push({ type: 'pixivImage', id: markerValue })
    }
  }

  flushParagraphs()
  return blocks
}

export function stripHtmlText(html: string): string {
  return html
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}
