export interface Course {
  id: string
  org_id: string
  title: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  scorm_version: string
  cover_image_url: string | null
  theme_id: string | null
  updated_at: string
  created_at: string
  deleted_at: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  created_by: string | null
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  position: number
  is_section_header: boolean
  created_at: string
}

export interface Block {
  id: string
  lesson_id: string
  type: string
  position: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
  created_at: string
}
