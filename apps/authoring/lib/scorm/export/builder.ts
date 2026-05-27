import JSZip from 'jszip'
import { generateManifest, SCORM_SCHEMA_FILES } from './manifest'
import { renderLesson } from './renderer'
import { buildThemeCSS } from '../theme-resolver'
import { SCORM_API_SHIM } from '@authoring/scorm-runtime'
import { readFileSync } from 'fs'
import { join } from 'path'

interface Course {
  id: string
  title: string
  description: string | null
  org_id: string
  theme_id: string | null
}

interface Lesson {
  id: string
  title: string
  position: number
  is_section_header: boolean
}

interface Block {
  id: string
  lesson_id: string
  type: string
  position: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
}

interface Theme {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
  heading_font?: string | null
  body_font?: string | null
  button_style?: { borderRadius?: string; padding?: string; shadow?: boolean } | null
  custom_css?: string | null
}

interface RiseMetadata {
  accentColor: string
  bodyTypeface: string
  headingTypeface: string
  uiTypeface: string
  blockCorners: string
}

interface BuildOptions {
  course: Course
  lessons: Lesson[]
  blocks: Block[]
  theme: Theme | null
  orgSlug: string
  passingScore?: number
  riseMetadata?: RiseMetadata | null
}

export async function buildScormPackage(opts: BuildOptions): Promise<Buffer> {
  const { course, lessons, blocks, theme, orgSlug, passingScore = 80 } = opts

  const zip = new JSZip()
  const themeCSS = theme ? buildThemeCSS(theme) : ''

  // ── imsmanifest.xml at ZIP root ───────────────────────────────────────────
  const manifest = generateManifest({
    courseId:     course.id,
    orgSlug,
    courseTitle:  course.title,
    lessons,
    passingScore,
  })
  zip.file('imsmanifest.xml', manifest)

  // ── SCORM 1.2 schema files ────────────────────────────────────────────────
  for (const [filename, content] of Object.entries(SCORM_SCHEMA_FILES)) {
    zip.file(filename, content)
  }

  // ── Shared assets folder ──────────────────────────────────────────────────
  const shared = zip.folder('shared')!

  // SCORM API shim
  shared.file('scorm_api.js', SCORM_API_SHIM)

  // Shared CSS
  const sharedStyles = readFileSync(
    join(process.cwd(), 'lib/scorm/export/styles.css'),
    'utf-8'
  )
  shared.file('styles.css', sharedStyles)

  // ── One lesson folder per SCO ─────────────────────────────────────────────
  const lessonsFolder = zip.folder('lessons')!

  const scos = lessons.filter((l) => !l.is_section_header)

  for (const lesson of scos) {
    const lessonBlocks = blocks
      .filter((b) => b.lesson_id === lesson.id)
      .sort((a, b) => a.position - b.position)

    const html = renderLesson({
      lesson,
      blocks:      lessonBlocks,
      allLessons:  lessons,
      theme,
      courseTitle: course.title,
      passingScore,
      themeCSS,
      riseMetadata: opts.riseMetadata || null,
    })

    const lessonFolder = lessonsFolder.folder(lesson.id)!
    lessonFolder.file('index.html', html)
  }

  // ── Generate ZIP buffer ───────────────────────────────────────────────────
  const buffer = await zip.generateAsync({
    type:               'nodebuffer',
    compression:        'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return buffer
}