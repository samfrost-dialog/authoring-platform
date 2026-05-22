/**
 * SCORM 1.2 package importer.
 * Supports Rise Articulate exports (reads embedded base64 JSON course data)
 * and generic SCORM 1.2 packages (falls back to HTML parsing).
 */

import JSZip from 'jszip'
import { parse as parseHtml } from 'node-html-parser'

export interface ImportedLesson {
  title: string
  position: number
  blocks: ImportedBlock[]
  mediaFiles: { key: string; data: Buffer; contentType: string }[]
}

export interface ImportedBlock {
  type: string
  position: number
  content: Record<string, unknown>
  settings: Record<string, unknown>
  importWarning?: string
}

export interface ImportResult {
  courseTitle: string
  lessons: ImportedLesson[]
  warnings: string[]
}

export async function parseScormPackage(zipBuffer: Buffer): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const warnings: string[] = []

  // ── Try Rise-specific parser first ───────────────────────────────────────
  const riseResult = await tryParseRise(zip, warnings)
  if (riseResult) return riseResult

  // ── Fall back to generic SCORM HTML parser ────────────────────────────────
  return parseGenericScorm(zip, warnings)
}

// ── Rise parser ───────────────────────────────────────────────────────────────

async function tryParseRise(zip: JSZip, warnings: string[]): Promise<ImportResult | null> {
  // Rise packages have scormcontent/index.html with base64 JSON embedded
  const indexFile = zip.file('scormcontent/index.html')
  if (!indexFile) return null

  const html = await indexFile.async('string')

  // Find the large base64 block containing course JSON
  const b64Matches = html.match(/[A-Za-z0-9+/]{100,}={0,2}/g)
  if (!b64Matches) return null

  let courseData: RiseCourseData | null = null
  for (const b64 of b64Matches) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      if (parsed.course && parsed.course.lessons) {
        courseData = parsed
        break
      }
    } catch {
      // Not JSON, try next
    }
  }

  if (!courseData) return null

  const course = courseData.course
  const courseTitle = course.title || 'Imported Course'
  const lessons: ImportedLesson[] = []

  for (let li = 0; li < course.lessons.length; li++) {
    const lesson = course.lessons[li]
    const blocks: ImportedBlock[] = []
    const mediaFiles: { key: string; data: Buffer; contentType: string }[] = []
    const items = lesson.items || []

    for (let bi = 0; bi < items.length; bi++) {
      const item = items[bi]
      const block = await mapRiseItem(item, zip, mediaFiles, warnings)
      if (block) {
        block.position = bi
        blocks.push(block)
      }
    }

    lessons.push({
      title: lesson.title || `Lesson ${li + 1}`,
      position: li,
      blocks,
      mediaFiles,
    })
  }

  return { courseTitle, lessons, warnings }
}

async function mapRiseItem(
  item: RiseItem,
  zip: JSZip,
  mediaFiles: { key: string; data: Buffer; contentType: string }[],
  warnings: string[]
): Promise<ImportedBlock | null> {
  const sub = item.items?.[0] || {}
  const type = item.type
  const variant = item.variant || ''
  const riseSettings = item.settings || {}

  switch (type) {
    case 'text': {
      const heading = sub.heading || ''
      const paragraph = sub.paragraph || ''
      const combined = [heading, paragraph].filter(Boolean).join('\n')
      if (!combined.trim()) return null
      const bgType = (riseSettings as { backgroundType?: string }).backgroundType
      const bgColor = (riseSettings as { backgroundColor?: string }).backgroundColor
      const resolvedBg = bgType === 'BLACK' ? '#000000' : bgType === 'COLOR' ? bgColor : bgType === 'ACCENT' ? '__accent__' : null
      return {
        type: 'text',
        position: 0,
        content: {
          html: stripRiseWrappers(combined),
          riseVariant: variant,
          backgroundColor: resolvedBg,
          textWidth: (riseSettings as { textWidth?: number }).textWidth || 100,
        },
        settings: {},
      }
    }

    case 'multimedia':
    case 'image': {
      const media = sub.media || {}
      const imageData = media.image
      const videoData = media.video

      if (videoData) {
        // Try to extract poster image
        let posterR2Key: string | null = null
        if (videoData.poster) {
          const posterKey = decodeURIComponent(videoData.poster)
          const posterFile = findAsset(zip, posterKey)
          if (posterFile) {
            const posterUuid = crypto.randomUUID()
            const posterExt = posterKey.split('.').pop() || 'jpg'
            posterR2Key = `__import__/${posterUuid}.${posterExt}`
            const posterData = Buffer.from(await (posterFile as JSZip.JSZipObject).async('arraybuffer'))
            mediaFiles.push({ key: posterR2Key, data: posterData, contentType: 'image/jpeg' })
          }
        }

        // Try to extract local video from ZIP
        const videoKey = decodeURIComponent(videoData.key || '')
        const localPath = `scormcontent/assets/${videoKey.split('/').pop()}`
        const videoFile = zip.file(localPath) || findAsset(zip, videoKey)

        if (videoFile) {
          const uuid = crypto.randomUUID()
          const ext = videoKey.split('.').pop() || 'mp4'
          const r2Key = `__import__/${uuid}.${ext}`
          const data = Buffer.from(await (videoFile as JSZip.JSZipObject).async('arraybuffer'))
          mediaFiles.push({ key: r2Key, data, contentType: 'video/mp4' })
          return {
            type: 'video',
            position: 0,
            content: { src: r2Key, poster: posterR2Key, type: 'upload', controls: true, borderRadius: '0' },
            settings: {},
          }
        }

        return {
          type: 'video',
          position: 0,
          content: { src: videoData.url || videoData.inputKey || '', poster: posterR2Key, type: 'upload', controls: true, borderRadius: '0' },
          settings: {},
          importWarning: 'Video was hosted on Rise CDN — re-upload in editor',
        }
      }

      if (imageData) {
        const crushedKey = imageData.crushedKey || ''
        const localPath = `scormcontent/assets/${decodeURIComponent(crushedKey)}`
        const imgFile = zip.file(localPath) || findAsset(zip, crushedKey)
        const caption = sub.caption ? stripRiseWrappers(sub.caption) : ''
        const paragraph = sub.paragraph ? stripRiseWrappers(sub.paragraph) : ''

        if (imgFile) {
          const uuid = crypto.randomUUID()
          const ext = crushedKey.split('.').pop()?.split('?')[0] || 'jpg'
          const r2Key = `__import__/${uuid}.${ext}`
          const data = Buffer.from(await (imgFile as JSZip.JSZipObject).async('arraybuffer'))
          const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
          mediaFiles.push({ key: r2Key, data, contentType })

          const bgType = (riseSettings as { backgroundType?: string }).backgroundType
          const bgColor = (riseSettings as { backgroundColor?: string }).backgroundColor
          const resolvedBg = bgType === 'BLACK' ? '#000000' : bgType === 'COLOR' ? bgColor : bgType === 'ACCENT' ? '__accent__' : null
          const opacity = (riseSettings as { opacity?: number | string }).opacity
          const opacityColor = (riseSettings as { opacityColor?: string }).opacityColor || '#000000'
          const zoomOnClick = (riseSettings as { zoomOnClick?: boolean }).zoomOnClick || false
          const paddingTop = (riseSettings as { paddingTop?: number }).paddingTop ?? 3
          const paddingBottom = (riseSettings as { paddingBottom?: number }).paddingBottom ?? 3

          // text overlay — full-width hero with text overlaid
          if (variant === 'text overlay') {
            return {
              type: 'image',
              position: 0,
              content: {
                src: r2Key, alt: '', caption, alignment: 'center', size: 'full',
                riseVariant: 'text overlay',
                overlayText: caption,
                overlayOpacity: opacity,
                overlayColor: opacityColor,
                backgroundColor: resolvedBg,
                borderRadius: '0',
                paddingTop, paddingBottom,
                zoomOnClick,
              },
              settings: {},
            }
          }

          // hero — full width image with caption below, accent background
          if (variant === 'hero') {
            return {
              type: 'image',
              position: 0,
              content: {
                src: r2Key, alt: '', caption, alignment: 'center', size: 'full',
                riseVariant: 'hero',
                backgroundColor: resolvedBg,
                borderRadius: '0',
                paddingTop, paddingBottom,
                zoomOnClick,
              },
              settings: {},
            }
          }

          // text aside — two column layout
          if (paragraph && variant === 'text aside') {
            return {
              type: 'columns',
              position: 0,
              content: {
                backgroundColor: resolvedBg,
                paddingTop, paddingBottom,
                columns: [
                  { widthPct: 50, blocks: [{ type: 'image', content: { src: r2Key, alt: '', caption: 'Click on image to zoom in.', alignment: 'center', size: 'large', borderRadius: '0.5rem', zoomOnClick: true }, settings: {} }] },
                  { widthPct: 50, blocks: [{ type: 'text', content: { html: paragraph }, settings: {} }] },
                ]
              },
              settings: {},
            }
          }

          return {
            type: 'image',
            position: 0,
            content: {
              src: r2Key, alt: '', caption, alignment: 'center', size: 'large',
              riseVariant: variant,
              backgroundColor: resolvedBg,
              borderRadius: '0.5rem',
              paddingTop, paddingBottom,
              zoomOnClick,
            },
            settings: {},
          }
        }

        return {
          type: 'image',
          position: 0,
          content: { src: '', alt: '', caption },
          settings: {},
          importWarning: 'Image asset not found in package — re-upload in editor',
        }
      }

      return null
    }

    case 'divider':
      return { type: 'divider', position: 0, content: { style: 'solid' }, settings: {} }

    case 'quote': {
      const text = sub.quote || sub.paragraph || sub.heading || ''
      const author = sub.attribution || sub.author || ''
      if (!text) return null
      return {
        type: 'quote',
        position: 0,
        content: { text: stripRiseWrappers(text), author: stripRiseWrappers(author) },
        settings: {},
      }
    }

    case 'accordion': {
      const subItems = item.items || []
      const accItems = subItems.map((s: RiseSubItem, i: number) => ({
        id: s.id || crypto.randomUUID(),
        title: stripRiseWrappers(s.heading || s.title || `Item ${i + 1}`),
        bodyHtml: stripRiseWrappers(s.paragraph || s.body || ''),
      }))
      return { type: 'accordion', position: 0, content: { items: accItems }, settings: {} }
    }

    case 'tabs': {
      const subItems = item.items || []
      const tabItems = subItems.map((s: RiseSubItem, i: number) => ({
        id: s.id || crypto.randomUUID(),
        label: stripRiseWrappers(s.heading || s.title || `Tab ${i + 1}`),
        bodyHtml: stripRiseWrappers(s.paragraph || s.body || ''),
      }))
      return { type: 'tabs', position: 0, content: { items: tabItems }, settings: {} }
    }

    case 'process':
    case 'numbered-list': {
      const subItems = item.items || []
      const processItems = subItems.map((s: RiseSubItem, i: number) => ({
        id: s.id || crypto.randomUUID(),
        title: stripRiseWrappers(s.heading || s.title || `Step ${i + 1}`),
        bodyHtml: stripRiseWrappers(s.paragraph || s.body || ''),
      }))
      return { type: 'process', position: 0, content: { items: processItems }, settings: {} }
    }

    case 'flashcards': {
      const subItems = item.items || []
      const cards = subItems.map((s: RiseSubItem) => ({
        id: s.id || crypto.randomUUID(),
        frontHtml: stripRiseWrappers(s.heading || s.front || ''),
        backHtml: stripRiseWrappers(s.paragraph || s.back || ''),
      }))
      return { type: 'flashcards', position: 0, content: { cards }, settings: {} }
    }

    case 'timeline': {
      const subItems = item.items || []
      const timelineItems = subItems.map((s: RiseSubItem, i: number) => ({
        id: s.id || crypto.randomUUID(),
        date: s.label || s.date || `${i + 1}`,
        title: stripRiseWrappers(s.heading || s.title || ''),
        bodyHtml: stripRiseWrappers(s.paragraph || s.body || ''),
      }))
      return { type: 'timeline', position: 0, content: { items: timelineItems }, settings: {} }
    }

    case 'knowledge-check':
    case 'quiz': {
      warnings.push(`Quiz/knowledge check block found — questions must be rebuilt manually in the editor`)
      return {
        type: type === 'knowledge-check' ? 'knowledge_check' : 'quiz',
        position: 0,
        content: { questions: [], passingScore: 80 },
        settings: {},
        importWarning: 'Quiz content cannot be auto-imported — rebuild questions in editor',
      }
    }

    case 'button':
    case 'cta': {
      const label = sub.label || sub.text || 'Continue'
      const url = sub.url || '#'
      return {
        type: 'button',
        position: 0,
        content: { label: stripRiseWrappers(label), url, style: 'primary', alignment: 'center' },
        settings: {},
      }
    }

    case 'statement': {
      const text = sub.paragraph || sub.heading || sub.text || ''
      return {
        type: 'statement',
        position: 0,
        content: { text: stripRiseWrappers(text), style: 'standard' },
        settings: {},
      }
    }

    default: {
      // Try to extract any text content
      const text = sub.heading || sub.paragraph || sub.body || sub.text || ''
      if (text) {
        return {
          type: 'text',
          position: 0,
          content: { html: stripRiseWrappers(text) },
          settings: {},
          importWarning: `Rise block type "${type}/${variant}" mapped to text`,
        }
      }
      warnings.push(`Unknown Rise block type "${type}/${variant}" — skipped`)
      return null
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findAsset(zip: JSZip, key: string): any {
  const decoded = decodeURIComponent(key)
  
  // Try full path first (handles subdirectories like I8MCi2/filename.jpg)
  const fullPath = `scormcontent/assets/${decoded}`
  const fullFound = zip.file(fullPath)
  if (fullFound) return fullFound

  // Try just the filename
  const filename = decoded.split('/').pop() || ''
  const found = zip.file(`scormcontent/assets/${filename}`)
  if (found) return found

  // Try recursive search by filename
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const files = zip.file(new RegExp(escaped + '$')) as JSZip.JSZipObject[] | null
  return files?.[0] || null
}

function stripRiseWrappers(html: string): string {
  if (!html) return ''
  // Remove Rise editor wrapper divs but keep inner content
  return html
    .replace(/<div[^>]*data-editor-id="[^"]*"[^>]*>/gi, '')
    .replace(/<div[^>]*class="rise-[^"]*"[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .trim()
}

// ── Type definitions ──────────────────────────────────────────────────────────

interface RiseCourseData {
  course: {
    title: string
    lessons: RiseLesson[]
  }
}

interface RiseLesson {
  id: string
  title: string
  type: string
  items: RiseItem[]
}

interface RiseItem {
  id: string
  type: string
  family: string
  variant: string
  items: RiseSubItem[]
  settings: Record<string, unknown>
}

interface RiseSubItem {
  id: string
  heading?: string
  paragraph?: string
  body?: string
  text?: string
  title?: string
  label?: string
  date?: string
  front?: string
  back?: string
  attribution?: string
  author?: string
  url?: string
  media?: {
    image?: {
      key: string
      crushedKey: string
      type: string
    }
    video?: {
      key: string
      url: string
      inputKey: string
      poster: string
    }
  }
  caption?: string
  quote?: string
}

// ── Generic SCORM HTML parser (fallback) ──────────────────────────────────────

async function parseGenericScorm(zip: JSZip, warnings: string[]): Promise<ImportResult> {
  const manifestFile = zip.file('imsmanifest.xml')
  if (!manifestFile) throw new Error('No imsmanifest.xml found — not a valid SCORM package.')

  const manifestXml = await manifestFile.async('string')
  const manifest = parseHtml(manifestXml, { lowerCaseTagName: true })

  const orgTitle = manifest.querySelector('organization > title')
  const courseTitle = orgTitle?.text?.trim() || 'Imported Course'
  const items = manifest.querySelectorAll('item[identifierref]')
  const lessons: ImportedLesson[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const identifierRef = item.getAttribute('identifierref') || ''
    const itemTitle = item.querySelector('title')?.text?.trim() || `Lesson ${i + 1}`
    const resource = manifest.querySelector(`resource[identifier="${identifierRef}"]`)
    const href = resource?.getAttribute('href') || ''
    if (!href) continue

    const htmlFile = zip.file(href)
    if (!htmlFile) continue

    const htmlContent = await htmlFile.async('string')
    const blocks = await extractBlocksFromHtml(htmlContent, warnings)
    lessons.push({ title: itemTitle, position: i, blocks, mediaFiles: [] })
  }

  return { courseTitle, lessons, warnings }
}

async function extractBlocksFromHtml(html: string, warnings: string[]): Promise<ImportedBlock[]> {
  const doc = parseHtml(html, { lowerCaseTagName: true })
  doc.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())

  const body = doc.querySelector('body') || doc
  const bodyContent = body.innerHTML?.trim()

  if (!bodyContent) return []

  warnings.push('Generic SCORM HTML imported as raw content — restructure in editor')
  return [{
    type: 'raw_html',
    position: 0,
    content: { html: bodyContent },
    settings: {},
    importWarning: 'Imported as raw HTML — restructure in editor',
  }]
}