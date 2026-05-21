import { z } from 'zod'

// ── Shared primitives ─────────────────────────────────────────────────────────

const R2Key = z.string() // R2 object key, not a URL
const TiptapHTML = z.string() // Tiptap-serialised HTML string

// ── Text & Media blocks ───────────────────────────────────────────────────────

export const TextBlockSchema = z.object({
  html: TiptapHTML,
})

export const ImageBlockSchema = z.object({
  src: R2Key,
  alt: z.string().default(''),
  caption: z.string().optional(),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  size: z.enum(['small', 'medium', 'large', 'full']).default('large'),
})

export const VideoBlockSchema = z.object({
  src: z.string(), // R2 key OR youtube/vimeo URL
  type: z.enum(['upload', 'youtube', 'vimeo']).default('upload'),
  autoplay: z.boolean().default(false),
  controls: z.boolean().default(true),
  caption: z.string().optional(),
})

export const AudioBlockSchema = z.object({
  src: R2Key,
  transcript: TiptapHTML.optional(),
  autoplay: z.boolean().default(false),
  showTranscript: z.boolean().default(true),
})

export const FileDownloadBlockSchema = z.object({
  src: R2Key,
  filename: z.string(),
  label: z.string().default('Download'),
  icon: z.string().optional(),
  fileSize: z.string().optional(),
})

export const EmbedBlockSchema = z.object({
  url: z.string().url(),
  height: z.number().default(400),
  sandboxFlags: z.string().default('allow-scripts allow-same-origin'),
})

export const DividerBlockSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  thickness: z.number().default(1),
  color: z.string().default('#E5E7EB'),
})

export const SpacerBlockSchema = z.object({
  height: z.number().default(40),
})

export const QuoteBlockSchema = z.object({
  text: TiptapHTML,
  author: z.string().optional(),
  attribution: z.string().optional(),
  style: z.enum(['standard', 'large', 'accent']).default('standard'),
})

export const CalloutBlockSchema = z.object({
  icon: z.string().default('💡'),
  html: TiptapHTML,
  bgColor: z.string().default('#EEF2FF'),
  borderColor: z.string().default('#4F46E5'),
})

export const CodeBlockSchema = z.object({
  code: z.string(),
  language: z.string().default('javascript'),
  showLineNumbers: z.boolean().default(true),
})

export const AnnotatedImageBlockSchema = z.object({
  src: R2Key,
  alt: z.string().default(''),
  markers: z.array(z.object({
    id: z.string(),
    x: z.number(), // percentage 0-100
    y: z.number(), // percentage 0-100
    label: z.string(),
    body: TiptapHTML,
  })),
})

export const ChartBlockSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'doughnut']),
  data: z.record(z.unknown()), // Chart.js data object
  options: z.record(z.unknown()).optional(),
  caption: z.string().optional(),
})

// ── Interactive & Layout blocks ───────────────────────────────────────────────

export const AccordionBlockSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    bodyHtml: TiptapHTML,
  })),
  allowMultiple: z.boolean().default(false),
})

export const TabsBlockSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    bodyHtml: TiptapHTML,
  })),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
})

export const ProcessBlockSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    bodyHtml: TiptapHTML,
    imageUrl: R2Key.optional(),
  })),
  layout: z.enum(['vertical', 'horizontal']).default('vertical'),
})

export const TimelineBlockSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    bodyHtml: TiptapHTML,
    imageUrl: R2Key.optional(),
  })),
  direction: z.enum(['vertical', 'horizontal']).default('vertical'),
})

export const FlashcardsBlockSchema = z.object({
  cards: z.array(z.object({
    id: z.string(),
    frontHtml: TiptapHTML,
    backHtml: TiptapHTML,
  })),
  flipTrigger: z.enum(['click', 'hover']).default('click'),
})

export const SortingActivityBlockSchema = z.object({
  categories: z.array(z.object({ id: z.string(), label: z.string() })),
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    categoryId: z.string(),
  })),
})

export const LabeledGraphicBlockSchema = z.object({
  bgImage: R2Key,
  labels: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    text: z.string(),
    body: TiptapHTML,
  })),
})

export const ButtonBlockSchema = z.object({
  label: z.string(),
  url: z.string().optional(),
  lessonId: z.string().uuid().optional(), // for in-course branching
  style: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
  icon: z.string().optional(),
  openInNewTab: z.boolean().default(false),
})

export const ButtonStackBlockSchema = z.object({
  buttons: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string(),
    style: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  })),
})

export const CheckboxListBlockSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    checkedByDefault: z.boolean().default(false),
  })),
})

export const NumberedListBlockSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: TiptapHTML })),
  style: z.enum(['decimal', 'alpha', 'roman']).default('decimal'),
})

export const ColumnsBlockSchema = z.object({
  columns: z.array(z.object({
    id: z.string(),
    widthPct: z.number(), // must sum to 100
    blocks: z.array(z.lazy(() => AnyBlockSchema)),
  })),
})

export const SidebarBlockSchema = z.object({
  side: z.enum(['left', 'right']).default('left'),
  sidebarHtml: TiptapHTML,
  mainHtml: TiptapHTML,
})

export const StatementBlockSchema = z.object({
  text: TiptapHTML,
  style: z.enum(['standard', 'big', 'quote']).default('standard'),
  bgImage: R2Key.optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.5),
})

export const GalleryBlockSchema = z.object({
  images: z.array(z.object({
    id: z.string(),
    src: R2Key,
    alt: z.string().default(''),
    caption: z.string().optional(),
  })),
  layout: z.enum(['grid', 'mosaic', 'slider']).default('grid'),
})

export const CarouselBlockSchema = z.object({
  slides: z.array(z.object({
    id: z.string(),
    bgImage: R2Key.optional(),
    heading: z.string(),
    body: TiptapHTML,
    cta: z.object({ label: z.string(), url: z.string() }).optional(),
  })),
  autoplay: z.boolean().default(false),
  autoplayDelay: z.number().default(5000),
})

export const HotspotBlockSchema = z.object({
  src: R2Key,
  spots: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    icon: z.enum(['plus', 'info', 'star']).default('plus'),
    label: z.string(),
    body: TiptapHTML,
  })),
})

export const FlipCardsBlockSchema = z.object({
  cards: z.array(z.object({
    id: z.string(),
    front: TiptapHTML,
    back: TiptapHTML,
    color: z.string().default('#4F46E5'),
  })),
  layout: z.enum(['grid', 'list']).default('grid'),
})

export const DragDropBlockSchema = z.object({
  zones: z.array(z.object({ id: z.string(), label: z.string() })),
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    zoneId: z.string(), // correct zone
  })),
})

// ── Quiz & Knowledge Check ────────────────────────────────────────────────────

export const QuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('multiple_choice'),
    id: z.string(),
    prompt: TiptapHTML,
    options: z.array(z.object({ id: z.string(), text: z.string() })),
    correctId: z.string(),
    feedback: z.object({ correct: z.string(), incorrect: z.string() }).optional(),
  }),
  z.object({
    type: z.literal('multiple_select'),
    id: z.string(),
    prompt: TiptapHTML,
    options: z.array(z.object({ id: z.string(), text: z.string() })),
    correctIds: z.array(z.string()),
    feedback: z.object({ correct: z.string(), incorrect: z.string() }).optional(),
  }),
  z.object({
    type: z.literal('true_false'),
    id: z.string(),
    prompt: TiptapHTML,
    correctAnswer: z.boolean(),
    feedback: z.object({ correct: z.string(), incorrect: z.string() }).optional(),
  }),
  z.object({
    type: z.literal('fill_blank'),
    id: z.string(),
    prompt: TiptapHTML,
    acceptedAnswers: z.array(z.string()),
    caseSensitive: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('matching'),
    id: z.string(),
    prompt: TiptapHTML,
    pairs: z.array(z.object({ id: z.string(), left: z.string(), right: z.string() })),
  }),
  z.object({
    type: z.literal('ordering'),
    id: z.string(),
    prompt: TiptapHTML,
    items: z.array(z.object({ id: z.string(), text: z.string() })),
    // items array order = correct order
  }),
  z.object({
    type: z.literal('numeric'),
    id: z.string(),
    prompt: TiptapHTML,
    min: z.number(),
    max: z.number(),
  }),
  z.object({
    type: z.literal('short_answer'),
    id: z.string(),
    prompt: TiptapHTML,
    sampleAnswer: z.string().optional(),
  }),
  z.object({
    type: z.literal('rating_scale'),
    id: z.string(),
    prompt: TiptapHTML,
    scale: z.enum(['1-5', '1-7']).default('1-5'),
    labels: z.object({ low: z.string(), high: z.string() }).optional(),
  }),
])

export const QuizBlockSchema = z.object({
  questions: z.array(QuestionSchema),
  passingScore: z.number().min(0).max(100).default(80),
  attemptsAllowed: z.number().nullable().default(null),
  showFeedback: z.boolean().default(true),
  randomiseQuestions: z.boolean().default(false),
  randomiseOptions: z.boolean().default(false),
  onPass: z.object({
    action: z.enum(['continue', 'jump']),
    lessonId: z.string().uuid().optional(),
  }).default({ action: 'continue' }),
  onFail: z.object({
    action: z.enum(['retry', 'jump', 'end']),
    lessonId: z.string().uuid().optional(),
  }).default({ action: 'retry' }),
})

export const KnowledgeCheckBlockSchema = QuizBlockSchema // same schema, different tracking

export const SurveyBlockSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'rating', 'multiple_choice', 'checkbox']),
    prompt: z.string(),
    options: z.array(z.string()).optional(),
  })),
})

// ── Branching Scenario ────────────────────────────────────────────────────────

export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  nextSceneId: z.string().nullable(), // null = end of scenario
  feedback: z.string().optional(),
})

export const SceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  bodyHtml: TiptapHTML,
  imageUrl: R2Key.optional(),
  characterUrl: R2Key.optional(),
  choices: z.array(ChoiceSchema),
  isOutcome: z.boolean().default(false),
  outcomeType: z.enum(['pass', 'fail', 'neutral']).optional(),
})

export const ScenarioBlockSchema = z.object({
  scenes: z.array(SceneSchema),
  startSceneId: z.string(),
  showPathReplay: z.boolean().default(true),
})

// ── Other blocks ─────────────────────────────────────────────────────────────

export const CertificateBlockSchema = z.object({
  templateId: z.string(),
  fields: z.array(z.object({
    label: z.string(),
    valueSource: z.enum(['learner_name', 'course_title', 'completion_date', 'score', 'custom']),
    customValue: z.string().optional(),
  })),
})

export const ContinueBlockSchema = z.object({
  label: z.string().default('Continue'),
  behavior: z.enum(['auto', 'manual']).default('manual'),
})

export const RawHtmlBlockSchema = z.object({
  html: z.string(), // preserved verbatim from SCORM import
  importWarning: z.string().optional(),
})

// ── Block type union ─────────────────────────────────────────────────────────

export const BLOCK_TYPES = [
  'text', 'image', 'video', 'audio', 'file_download', 'embed',
  'divider', 'spacer', 'quote', 'callout', 'code_block',
  'annotated_image', 'chart', 'accordion', 'tabs', 'process',
  'timeline', 'flashcards', 'sorting_activity', 'labeled_graphic',
  'button', 'button_stack', 'checkbox_list', 'numbered_list',
  'columns', 'sidebar', 'statement', 'gallery', 'carousel',
  'hotspot', 'flip_cards', 'drag_drop', 'knowledge_check',
  'quiz', 'survey', 'scenario', 'certificate', 'continue',
  'raw_html',
] as const

export type BlockType = typeof BLOCK_TYPES[number]

export const AnyBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'),              content: TextBlockSchema }),
  z.object({ type: z.literal('image'),             content: ImageBlockSchema }),
  z.object({ type: z.literal('video'),             content: VideoBlockSchema }),
  z.object({ type: z.literal('audio'),             content: AudioBlockSchema }),
  z.object({ type: z.literal('file_download'),     content: FileDownloadBlockSchema }),
  z.object({ type: z.literal('embed'),             content: EmbedBlockSchema }),
  z.object({ type: z.literal('divider'),           content: DividerBlockSchema }),
  z.object({ type: z.literal('spacer'),            content: SpacerBlockSchema }),
  z.object({ type: z.literal('quote'),             content: QuoteBlockSchema }),
  z.object({ type: z.literal('callout'),           content: CalloutBlockSchema }),
  z.object({ type: z.literal('code_block'),        content: CodeBlockSchema }),
  z.object({ type: z.literal('annotated_image'),   content: AnnotatedImageBlockSchema }),
  z.object({ type: z.literal('chart'),             content: ChartBlockSchema }),
  z.object({ type: z.literal('accordion'),         content: AccordionBlockSchema }),
  z.object({ type: z.literal('tabs'),              content: TabsBlockSchema }),
  z.object({ type: z.literal('process'),           content: ProcessBlockSchema }),
  z.object({ type: z.literal('timeline'),          content: TimelineBlockSchema }),
  z.object({ type: z.literal('flashcards'),        content: FlashcardsBlockSchema }),
  z.object({ type: z.literal('sorting_activity'),  content: SortingActivityBlockSchema }),
  z.object({ type: z.literal('labeled_graphic'),   content: LabeledGraphicBlockSchema }),
  z.object({ type: z.literal('button'),            content: ButtonBlockSchema }),
  z.object({ type: z.literal('button_stack'),      content: ButtonStackBlockSchema }),
  z.object({ type: z.literal('checkbox_list'),     content: CheckboxListBlockSchema }),
  z.object({ type: z.literal('numbered_list'),     content: NumberedListBlockSchema }),
  z.object({ type: z.literal('columns'),           content: ColumnsBlockSchema }),
  z.object({ type: z.literal('sidebar'),           content: SidebarBlockSchema }),
  z.object({ type: z.literal('statement'),         content: StatementBlockSchema }),
  z.object({ type: z.literal('gallery'),           content: GalleryBlockSchema }),
  z.object({ type: z.literal('carousel'),          content: CarouselBlockSchema }),
  z.object({ type: z.literal('hotspot'),           content: HotspotBlockSchema }),
  z.object({ type: z.literal('flip_cards'),        content: FlipCardsBlockSchema }),
  z.object({ type: z.literal('drag_drop'),         content: DragDropBlockSchema }),
  z.object({ type: z.literal('knowledge_check'),   content: KnowledgeCheckBlockSchema }),
  z.object({ type: z.literal('quiz'),              content: QuizBlockSchema }),
  z.object({ type: z.literal('survey'),            content: SurveyBlockSchema }),
  z.object({ type: z.literal('scenario'),          content: ScenarioBlockSchema }),
  z.object({ type: z.literal('certificate'),       content: CertificateBlockSchema }),
  z.object({ type: z.literal('continue'),          content: ContinueBlockSchema }),
  z.object({ type: z.literal('raw_html'),          content: RawHtmlBlockSchema }),
])

export type AnyBlock = z.infer<typeof AnyBlockSchema>
