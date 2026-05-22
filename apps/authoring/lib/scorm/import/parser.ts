/**
 * SCORM 1.2 package importer.
 * Parses an uploaded ZIP, reads imsmanifest.xml, maps HTML content to blocks.
 * Works with Rise exports and other SCORM 1.2 tools.
 * Unrecognised content falls back to raw_html blocks.
 */

import JSZip from 'jszip'
import { parse as parseHtml } from 'node-html-parser'

export interface ImportedLesson {
  title: string
  position: number
  blocks: ImportedBlock[]
}

export interface ImportedBlock {
  type: string
  position: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any>
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

  // ── Find and parse imsmanifest.xml ────────────────────────────────────────
  const manifestFile = zip.file('imsmanifest.xml')
  if (!manifestFile) {
    throw new Error('No imsmanifest.xml found — this may not be a valid SCORM package.')
  }

  const manifestXml = await manifestFile.async('string')
  const manifest = parseHtml(manifestXml, { lowerCaseTagName: true })

  // Course title
  const orgTitle = manifest.querySelector('organization > title')
  const courseTitle = orgTitle?.text?.trim() || 'Imported Course'

  // SCO items
  const items = manifest.querySelectorAll('item[identifierref]')

  if (items.length === 0) {
    warnings.push('No SCO items found in manifest — importing as single lesson.')
  }

  const lessons: ImportedLesson[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const identifierRef = item.getAttribute('identifierref') || ''
    const itemTitle = item.querySelector('title')?.text?.trim() || `Lesson ${i + 1}`

    // Find resource href
    const resource = manifest.querySelector(`resource[identifier="${identifierRef}"]`)
    const href = resource?.getAttribute('href') || ''

    if (!href) {
      warnings.push(`Lesson "${itemTitle}" has no launchable resource — skipping.`)
      continue
    }

    // Find and read the HTML file
    const htmlFile = zip.file(href) || zip.file(href.replace(/\//g, '\\'))
    if (!htmlFile) {
      warnings.push(`Could not find HTML file for "${itemTitle}" (${href}) — skipping.`)
      continue
    }

    const htmlContent = await htmlFile.async('string')
    const blocks = await extractBlocksFromHtml(htmlContent, warnings, zip, href)

    lessons.push({
      title: itemTitle,
      position: i,
      blocks,
    })
  }

  // If no SCO items, try to import body content as a single lesson
  if (lessons.length === 0) {
    const htmlFiles = Object.keys(zip.files).filter((f) =>
      f.endsWith('.html') || f.endsWith('.htm')
    ).filter((f) => !f.includes('_sco') && f.split('/').length <= 2)

    for (let i = 0; i < Math.min(htmlFiles.length, 1); i++) {
      const file = zip.file(htmlFiles[i])
      if (!file) continue
      const html = await file.async('string')
      const blocks = await extractBlocksFromHtml(html, warnings, zip, htmlFiles[i])
      lessons.push({ title: courseTitle, position: 0, blocks })
    }
  }

  return { courseTitle, lessons, warnings }
}

// ── HTML-to-block mapper ──────────────────────────────────────────────────────

async function extractBlocksFromHtml(
  html: string,
  warnings: string[],
  _zip: JSZip,
  _sourcePath: string
): Promise<ImportedBlock[]> {
  const doc = parseHtml(html, { lowerCaseTagName: true })
  const blocks: ImportedBlock[] = []
  let position = 0

  // Remove script/style/nav/header elements for cleaner parsing
  doc.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())

  // Try Rise-specific block mapping first
  const riseBlocks = doc.querySelectorAll('[class*="rise-block"], [class*="block-"]')

  if (riseBlocks.length > 0) {
    for (const el of riseBlocks) {
      const block = mapRiseElement(el, position)
      if (block) {
        blocks.push(block)
        position++
      }
    }
    return blocks
  }

  // Generic HTML extraction — map common elements to block types
  const body = doc.querySelector('body') || doc
  const children = body.childNodes

  let currentHtml = ''

  function flushText() {
    const trimmed = currentHtml.trim()
    if (trimmed && trimmed.length > 0) {
      blocks.push({
        type: 'text',
        position: position++,
        content: { html: trimmed },
        settings: {},
      })
      currentHtml = ''
    }
  }

  for (const node of children) {
    const tag = (node as { tagName?: string }).tagName?.toLowerCase() || ''
    const el = node as ReturnType<typeof parseHtml>

    if (tag === 'img') {
      flushText()
      blocks.push({
        type: 'image',
        position: position++,
        content: {
          alt: el.getAttribute('alt') || '',
          publicUrl: el.getAttribute('src') || '',
        },
        settings: {},
        importWarning: 'Image URL may not resolve — update in editor',
      })
    } else if (tag === 'video') {
      flushText()
      const src = el.querySelector('source')?.getAttribute('src') || el.getAttribute('src') || ''
      blocks.push({
        type: 'video',
        position: position++,
        content: { src, type: 'upload' },
        settings: {},
        importWarning: 'Video URL may not resolve — update in editor',
      })
    } else if (tag === 'audio') {
      flushText()
      const src = el.querySelector('source')?.getAttribute('src') || el.getAttribute('src') || ''
      blocks.push({
        type: 'audio',
        position: position++,
        content: { src },
        settings: {},
        importWarning: 'Audio URL may not resolve — update in editor',
      })
    } else if (tag === 'blockquote') {
      flushText()
      blocks.push({
        type: 'quote',
        position: position++,
        content: { text: el.innerHTML || '' },
        settings: {},
      })
    } else if (tag === 'pre' || tag === 'code') {
      flushText()
      blocks.push({
        type: 'code_block',
        position: position++,
        content: { code: el.text || '', language: 'text' },
        settings: {},
      })
    } else if (tag === 'hr') {
      flushText()
      blocks.push({
        type: 'divider',
        position: position++,
        content: { style: 'solid' },
        settings: {},
      })
    } else if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'div'].includes(tag)) {
      currentHtml += el.outerHTML + '\n'
    } else if (el.outerHTML) {
      currentHtml += el.outerHTML + '\n'
    }
  }

  flushText()

  // If no structured blocks found, preserve entire body as raw_html
  if (blocks.length === 0) {
    const bodyContent = body.innerHTML?.trim()
    if (bodyContent) {
      warnings.push('Could not map content to structured blocks — preserved as raw HTML for manual re-authoring.')
      blocks.push({
        type: 'raw_html',
        position: 0,
        content: { html: bodyContent },
        settings: {},
        importWarning: 'Imported as raw HTML — restructure in editor',
      })
    }
  }

  return blocks
}

// ── Rise-specific block mapper ────────────────────────────────────────────────

function mapRiseElement(el: ReturnType<typeof parseHtml>, position: number): ImportedBlock | null {
  const className = el.getAttribute('class') || ''

  // Text
  if (className.includes('rise-block-text') || className.includes('block-text')) {
    return { type: 'text', position, content: { html: el.innerHTML || '' }, settings: {} }
  }

  // Image
  if (className.includes('rise-block-image')) {
    const img = el.querySelector('img')
    return {
      type: 'image', position,
      content: { publicUrl: img?.getAttribute('src') || '', alt: img?.getAttribute('alt') || '' },
      settings: {},
      importWarning: 'Image URL may need updating',
    }
  }

  // Video
  if (className.includes('rise-block-video')) {
    const iframe = el.querySelector('iframe')
    const video = el.querySelector('video')
    const src = iframe?.getAttribute('src') || video?.getAttribute('src') || ''
    const type = src.includes('youtube') ? 'youtube' : src.includes('vimeo') ? 'vimeo' : 'upload'
    return { type: 'video', position, content: { src, type }, settings: {} }
  }

  // Accordion
  if (className.includes('rise-block-accordion')) {
    const items = el.querySelectorAll('.accordion-item').map((item, i) => ({
      id: `imported_${i}`,
      title: item.querySelector('.accordion-title')?.text?.trim() || `Item ${i + 1}`,
      bodyHtml: item.querySelector('.accordion-body')?.innerHTML || '',
    }))
    return { type: 'accordion', position, content: { items }, settings: {} }
  }

  // Tabs
  if (className.includes('rise-block-tabs')) {
    const items = el.querySelectorAll('.tab-item').map((item, i) => ({
      id: `imported_${i}`,
      label: item.querySelector('.tab-label')?.text?.trim() || `Tab ${i + 1}`,
      bodyHtml: item.querySelector('.tab-body')?.innerHTML || '',
    }))
    return { type: 'tabs', position, content: { items }, settings: {} }
  }

  // Process
  if (className.includes('rise-block-process')) {
    const items = el.querySelectorAll('.process-step').map((step, i) => ({
      id: `imported_${i}`,
      title: step.querySelector('.step-title')?.text?.trim() || `Step ${i + 1}`,
      bodyHtml: step.querySelector('.step-body')?.innerHTML || '',
    }))
    return { type: 'process', position, content: { items }, settings: {} }
  }

  // Quote
  if (className.includes('rise-block-quote')) {
    const blockquote = el.querySelector('blockquote')
    return {
      type: 'quote', position,
      content: { text: blockquote?.innerHTML || el.innerHTML || '' },
      settings: {},
    }
  }

  // Quiz
  if (className.includes('rise-block-quiz')) {
    return {
      type: 'quiz', position,
      content: { questions: [], passingScore: 80 },
      settings: {},
      importWarning: 'Quiz content could not be automatically imported — rebuild questions in editor',
    }
  }

  // Flashcards
  if (className.includes('rise-block-flashcard')) {
    const cards = el.querySelectorAll('.card').map((card, i) => ({
      id: `imported_${i}`,
      frontHtml: card.querySelector('.card-front')?.innerHTML || '',
      backHtml: card.querySelector('.card-back')?.innerHTML || '',
    }))
    return { type: 'flashcards', position, content: { cards }, settings: {} }
  }

  // data-block-type attribute (some Rise versions)
  const blockType = el.getAttribute('data-block-type')
  if (blockType) {
    return { type: blockType, position, content: { html: el.innerHTML }, settings: {} }
  }

  // Fallback — raw HTML
  return {
    type: 'raw_html', position,
    content: { html: el.outerHTML },
    settings: {},
    importWarning: 'Could not map to a known block type — preserved as raw HTML',
  }
}