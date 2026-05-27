/**
 * SCORM 1.2 package importer — Rise-faithful block extraction.
 *
 * Reads Rise's embedded base64 JSON, extracts blocks with full fidelity metadata
 * (variant, backgroundType, inline styles, settings) so the preview renderer
 * can apply Rise's own CSS classes and reproduce identical appearance.
 */

import JSZip from 'jszip'

export interface RiseMetadata {
  accentColor: string
  bodyTypeface: string
  headingTypeface: string
  uiTypeface: string
  blockCorners: string
}

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
  riseMetadata?: RiseMetadata
}

export async function parseScormPackage(zipBuffer: Buffer): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const warnings: string[] = []

  const riseResult = await tryParseRise(zip, warnings)
  if (riseResult) return riseResult

  return parseGenericScorm(zip, warnings)
}

// ── Rise parser ───────────────────────────────────────────────────────────────

async function tryParseRise(zip: JSZip, warnings: string[]): Promise<ImportResult | null> {
  const indexFile = zip.file('scormcontent/index.html')
  if (!indexFile) return null

  const html = await indexFile.async('string')
  const b64Matches = html.match(/[A-Za-z0-9+/]{100,}={0,2}/g)
  if (!b64Matches) return null

  let courseData: RiseCourseData | null = null
  for (const b64 of b64Matches) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      if (parsed.course?.lessons) { courseData = parsed; break }
    } catch { /* not JSON */ }
  }
  if (!courseData) return null

  const course = courseData.course
  const courseTitle = course.title || 'Imported Course'
  const theme = course.theme || {}

  const riseMetadata: RiseMetadata = {
    accentColor:    String(theme.colorAccent     || '#0076ce'),
    bodyTypeface:   String(course.bodyTypeface   || 'Roboto'),
    headingTypeface:String(course.headingTypeface|| 'Roboto'),
    uiTypeface:     String(course.uiTypeface     || 'Lato'),
    blockCorners:   String(theme.blockCorners    || 'ROUNDED'),
  }

  const lessons: ImportedLesson[] = []

  for (let li = 0; li < course.lessons.length; li++) {
    const lesson = course.lessons[li]
    const blocks: ImportedBlock[] = []
    const mediaFiles: { key: string; data: Buffer; contentType: string }[] = []
    const items = lesson.items || []

    for (let bi = 0; bi < items.length; bi++) {
      const item = items[bi]
      const mapped = await mapRiseItem(item, zip, mediaFiles, warnings)
      if (mapped) {
        mapped.position = bi
        blocks.push(mapped)
      }
    }

    lessons.push({ title: lesson.title || `Lesson ${li + 1}`, position: li, blocks, mediaFiles })
  }

  return { courseTitle, lessons, warnings, riseMetadata }
}

// ── Rise item mapper ──────────────────────────────────────────────────────────

async function mapRiseItem(
  item: RiseItem,
  zip: JSZip,
  mediaFiles: { key: string; data: Buffer; contentType: string }[],
  warnings: string[]
): Promise<ImportedBlock | null> {
  const sub = item.items?.[0] || {}
  const type = item.type
  const variant = item.variant || ''
  const settings = item.settings || {}

  // ── Background / section styling ────────────────────────────────────────
  const bgType = (settings as { backgroundType?: string }).backgroundType
  const bgColor = (settings as { backgroundColor?: string }).backgroundColor
  const paddingTop = (settings as { paddingTop?: number }).paddingTop ?? 3
  const paddingBottom = (settings as { paddingBottom?: number }).paddingBottom ?? 3
  const textWidth = (settings as { textWidth?: number }).textWidth ?? 92
  const opacity = (settings as { opacity?: number | string }).opacity
  const opacityColor = (settings as { opacityColor?: string }).opacityColor || '#000000'
  const zoomOnClick = !!(settings as { zoomOnClick?: boolean }).zoomOnClick

  // Rise bg classes: bg--type-black | bg--type-accent | bg--type-color | bg--type-light
  const bgClass = bgType === 'BLACK' ? 'bg--type-black'
    : bgType === 'ACCENT' ? 'bg--type-accent'
    : bgType === 'COLOR' && bgColor ? 'bg--type-color'
    : 'bg--type-light'

  const sectionStyle: Record<string, unknown> = {
    riseVariant: variant,
    bgClass,
    bgColor: bgType === 'COLOR' ? bgColor : undefined,
    paddingTop,
    paddingBottom,
    textWidth,
    opacity,
    opacityColor,
    zoomOnClick,
  }

  switch (type) {
    // ── Text ─────────────────────────────────────────────────────────────
    case 'text': {
      const heading   = sub.heading   || ''
      const paragraph = sub.paragraph || ''
      const combined  = [heading, paragraph].filter(Boolean).join('\n')
      if (!combined.trim()) return null

      // Detect if it's a table variant
      const isTable = variant === 'table' || combined.includes('<table')

      return {
        type: 'text',
        position: 0,
        content: {
          html: combined,
          riseVariant: variant,
          isTable,
          ...sectionStyle,
        },
        settings: {},
      }
    }

    // ── Multimedia / video ────────────────────────────────────────────────
    case 'multimedia': {
      const media    = sub.media    || {}
      const videoData = media.video

      if (videoData) {
        // Extract poster image
        let posterKey: string | null = null
        if (videoData.poster) {
          const posterFile = findAsset(zip, decodeURIComponent(videoData.poster))
          if (posterFile) {
            const uuid = crypto.randomUUID()
            const ext  = videoData.poster.split('.').pop()?.split('?')[0] || 'jpg'
            posterKey  = `__import__/${uuid}.${ext}`
            mediaFiles.push({
              key: posterKey,
              data: Buffer.from(await (posterFile as JSZip.JSZipObject).async('arraybuffer')),
              contentType: 'image/jpeg',
            })
          }
        }

        // Extract video file
        const videoKey = decodeURIComponent(videoData.key || '')
        const videoFile = findAsset(zip, videoKey)
        if (videoFile) {
          const uuid = crypto.randomUUID()
          const ext  = videoKey.split('.').pop() || 'mp4'
          const r2Key = `__import__/${uuid}.${ext}`
          mediaFiles.push({
            key: r2Key,
            data: Buffer.from(await (videoFile as JSZip.JSZipObject).async('arraybuffer')),
            contentType: 'video/mp4',
          })
          return {
            type: 'video',
            position: 0,
            content: { src: r2Key, poster: posterKey, controls: true, riseVariant: 'video', ...sectionStyle },
            settings: {},
          }
        }

        return {
          type: 'video',
          position: 0,
          content: { src: videoData.url || '', poster: posterKey, controls: true, riseVariant: 'video', ...sectionStyle },
          settings: {},
          importWarning: 'Video hosted on Rise CDN — re-upload in editor',
        }
      }
      return null
    }

    // ── Image (all variants) ──────────────────────────────────────────────
    case 'image': {
      const media    = sub.media    || {}
      const imageData = media.image
      const caption   = sub.caption   || ''
      const paragraph = sub.paragraph || ''

      if (!imageData) return null

      const crushedKey = decodeURIComponent(imageData.crushedKey || '')
      const imgFile    = findAsset(zip, crushedKey)
      let r2Key: string | null = null

      if (imgFile) {
        const uuid = crypto.randomUUID()
        const ext  = crushedKey.split('.').pop()?.split('?')[0] || 'jpg'
        r2Key      = `__import__/${uuid}.${ext}`
        const data = Buffer.from(await (imgFile as JSZip.JSZipObject).async('arraybuffer'))
        const ct   = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
        mediaFiles.push({ key: r2Key, data, contentType: ct })
      }

      // Rise image modifier class maps to variant
      const riseBlockClass = variant === 'text aside'   ? 'block-image--text-aside'
        : variant === 'text overlay'                    ? 'block-image--text-overlay'
        : variant === 'hero'                            ? 'block-image--hero'
        : variant === 'banner'                          ? 'block-image--banner'
        : ''

      return {
        type: 'image',
        position: 0,
        content: {
          src: r2Key || '',
          caption,
          paragraph,
          riseVariant: variant,
          riseBlockClass,
          overlayOpacity: opacity,
          overlayColor:   opacityColor,
          zoomOnClick,
          ...sectionStyle,
        },
        settings: {},
        importWarning: r2Key ? undefined : 'Image asset not found — re-upload in editor',
      }
    }

    // ── Accordion ─────────────────────────────────────────────────────────
    case 'accordion': {
      const items = (item.items || []).map((s: RiseSubItem, i: number) => ({
        id:       s.id || crypto.randomUUID(),
        title:    s.heading || s.title || `Item ${i + 1}`,
        bodyHtml: s.paragraph || s.body || '',
      }))
      return { type: 'accordion', position: 0, content: { items, ...sectionStyle }, settings: {} }
    }

    // ── Tabs ──────────────────────────────────────────────────────────────
    case 'tabs': {
      const items = (item.items || []).map((s: RiseSubItem, i: number) => ({
        id:       s.id || crypto.randomUUID(),
        label:    s.heading || s.title || `Tab ${i + 1}`,
        bodyHtml: s.paragraph || s.body || '',
      }))
      return { type: 'tabs', position: 0, content: { items, ...sectionStyle }, settings: {} }
    }

    // ── Process ───────────────────────────────────────────────────────────
    case 'process': {
      const items = (item.items || []).map((s: RiseSubItem, i: number) => ({
        id:       s.id || crypto.randomUUID(),
        title:    s.heading || s.title || `Step ${i + 1}`,
        bodyHtml: s.paragraph || s.body || '',
      }))
      return { type: 'process', position: 0, content: { items, ...sectionStyle }, settings: {} }
    }

    // ── Flashcards ────────────────────────────────────────────────────────
    case 'flashcards': {
      const cards = (item.items || []).map((s: RiseSubItem) => ({
        id:        s.id || crypto.randomUUID(),
        frontHtml: s.heading || s.front || '',
        backHtml:  s.paragraph || s.back || '',
      }))
      return { type: 'flashcards', position: 0, content: { cards, ...sectionStyle }, settings: {} }
    }

    // ── Quiz / knowledge check ─────────────────────────────────────────────
    case 'knowledge-check':
    case 'quiz': {
      warnings.push(`Quiz block found — rebuild questions in editor`)
      return {
        type: type === 'knowledge-check' ? 'knowledge_check' : 'quiz',
        position: 0,
        content: { questions: [], passingScore: 80, ...sectionStyle },
        settings: {},
        importWarning: 'Quiz content cannot be auto-imported — rebuild in editor',
      }
    }

    // ── Button / CTA ───────────────────────────────────────────────────────
    case 'button':
    case 'cta': {
      return {
        type: 'button',
        position: 0,
        content: {
          label: sub.label || sub.text || 'Continue',
          url: sub.url || '#',
          style: 'primary',
          alignment: 'center',
          ...sectionStyle,
        },
        settings: {},
      }
    }

    // ── Fallback — preserve as text if there's any HTML content ──────────
    default: {
      const text = sub.heading || sub.paragraph || sub.body || sub.text || ''
      if (text) {
        return {
          type: 'text',
          position: 0,
          content: { html: text, riseVariant: type, ...sectionStyle },
          settings: {},
          importWarning: `Rise block "${type}/${variant}" mapped to text`,
        }
      }
      warnings.push(`Unknown Rise block type "${type}/${variant}" — skipped`)
      return null
    }
  }
}

// ── Asset finder ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findAsset(zip: JSZip, key: string): any {
  const decoded  = decodeURIComponent(key)
  const fullPath = `scormcontent/assets/${decoded}`
  const direct   = zip.file(fullPath)
  if (direct) return direct

  const filename = decoded.split('/').pop() || ''
  const flat     = zip.file(`scormcontent/assets/${filename}`)
  if (flat) return flat

  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const results  = zip.file(new RegExp(escaped + '$')) as JSZip.JSZipObject[]
  return results?.[0] || null
}

// ── Generic SCORM fallback ────────────────────────────────────────────────────

import { parse as parseHtml } from 'node-html-parser'

async function parseGenericScorm(zip: JSZip, warnings: string[]): Promise<ImportResult> {
  const manifestFile = zip.file('imsmanifest.xml')
  if (!manifestFile) throw new Error('No imsmanifest.xml found — not a valid SCORM package.')

  const manifestXml = await manifestFile.async('string')
  const manifest    = parseHtml(manifestXml, { lowerCaseTagName: true })
  const courseTitle = manifest.querySelector('organization > title')?.text?.trim() || 'Imported Course'
  const items       = manifest.querySelectorAll('item[identifierref]')
  const lessons: ImportedLesson[] = []

  for (let i = 0; i < items.length; i++) {
    const item    = items[i]
    const title   = item.querySelector('title')?.text?.trim() || `Lesson ${i + 1}`
    const ref     = item.getAttribute('identifierref') || ''
    const resource = manifest.querySelector(`resource[identifier="${ref}"]`)
    const href    = resource?.getAttribute('href') || ''
    if (!href) continue

    const htmlFile = zip.file(href)
    if (!htmlFile) continue

    const htmlContent = await htmlFile.async('string')
    const doc = parseHtml(htmlContent, { lowerCaseTagName: true })
    doc.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())
    const body = doc.querySelector('body') || doc
    const bodyContent = body.innerHTML?.trim()

    if (bodyContent) {
      warnings.push(`Lesson "${title}" imported as raw HTML — restructure in editor`)
      lessons.push({
        title, position: i, mediaFiles: [],
        blocks: [{ type: 'raw_html', position: 0, content: { html: bodyContent }, settings: {} }],
      })
    }
  }

  return { courseTitle, lessons, warnings }
}

// ── Type definitions ──────────────────────────────────────────────────────────

interface RiseCourseData {
  course: {
    title: string
    theme: Record<string, unknown>
    bodyTypeface?: string
    headingTypeface?: string
    uiTypeface?: string
    lessons: RiseLesson[]
  }
}

interface RiseLesson {
  id: string; title: string; type: string; items: RiseItem[]
}

interface RiseItem {
  id: string; type: string; family: string; variant: string
  items: RiseSubItem[]; settings: Record<string, unknown>
}

interface RiseSubItem {
  id: string; heading?: string; paragraph?: string; body?: string
  text?: string; title?: string; label?: string; date?: string
  front?: string; back?: string; attribution?: string; author?: string
  url?: string; quote?: string
  media?: {
    image?: { key: string; crushedKey: string; type: string }
    video?: { key: string; url: string; inputKey: string; poster: string }
  }
  caption?: string
}