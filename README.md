# Course Authoring Platform

A self-hosted, no-code course authoring platform replacing Rise Articulate Pro/Enterprise. Built on the same stack as your existing LMS.

**Stack:** Next.js 16 · Supabase · Cloudflare R2 · Vercel · GitHub Actions

---

## Build Status: ✅ Complete

### Phase 1 — Core Authoring Platform ✅
| Milestone | Notes |
|---|---|
| 1a — Scaffold | Monorepo, Supabase schema, R2 bucket, GitHub Actions CI |
| 1b — Auth & Dashboard | Supabase Auth, org/course list, create/delete course |
| 1c — Editor Shell | Three-panel layout, lesson outline, block canvas, dnd-kit |
| 1d — Block Library | All 38 block types, Tiptap rich text editor |
| 1e — Media Uploads | R2 presigned upload, image/video/audio/file blocks |
| 1f — Autosave | 1s debounce, animated save indicator |
| 1g — Preview | Standalone lesson preview with lesson nav and progress |

### Phase 2 — Themes & Branding ✅
| Milestone | Notes |
|---|---|
| 2a — Theme Editor | Full settings UI with live miniature course preview |
| 2b — Font System | Searchable Google Fonts picker + custom font upload to R2 |
| 2c — Custom CSS | CodeMirror editor with CSS syntax highlighting |
| 2d — Theme Apply | Theme applied in preview; theme picker in editor toolbar |

### Phase 3 — Quiz & Branching Engine ✅
| Milestone | Notes |
|---|---|
| 3a — Quiz Builder | All 9 question types with full editor UI |
| 3b — Quiz Runtime | Client-side scoring, feedback, pass/fail, retry |
| 3c — Branching | Scene graph editor, path tracking, outcome scenes |
| 3d — Knowledge Checks | Unscored interactions, distinct visual in editor |
| 3e — SCORM tracking | cmi.interactions, score, lesson_status via quiz attempts API |

### Phase 4 — SCORM Export & Import ✅
| Milestone | Notes |
|---|---|
| 4a — HTML Renderer | Server-side lesson-to-HTML for all 38 block types |
| 4b — SCORM Manifest | imsmanifest.xml, SCO per lesson, schema files |
| 4c — API Shim | Full SCORM 1.2 LMSInitialize/Commit/Finish |
| 4d — ZIP + R2 | Package build, upload to R2, signed download URL |
| 4e — SCORM Import | ZIP parse, HTML-to-block mapping, Rise pattern matching |
| 4f — QA | SCORM 1.2 conformance validator, 11-point checklist |

---

## Architecture

```
apps/authoring/
├── app/
│   ├── (auth)/login, signup
│   ├── dashboard/               Course library
│   ├── dashboard/themes/        Theme manager
│   ├── dashboard/import/        SCORM import
│   ├── editor/[id]/             Course editor
│   ├── preview/[id]/            Learner preview
│   └── api/
│       ├── courses/[id]/        PATCH metadata + export
│       ├── courses/[id]/export/ SCORM 1.2 ZIP build
│       ├── import/scorm/        SCORM import parser
│       ├── validate/scorm/      Conformance validator
│       ├── media/sign, delete   R2 presigned URLs
│       ├── fonts/sign           Font upload
│       ├── themes/, [id]        Theme CRUD
│       └── quiz-attempts/       SCORM tracking
├── components/
│   ├── editor/                  Shell, toolbar, inspector, Tiptap
│   ├── preview/                 Preview shell and block renderer
│   ├── dashboard/               Course grid, nav, new course modal
│   ├── quiz/                    Quiz + scenario builder/runtime + SCORM tracking
│   ├── themes/                  Theme editor, preview, font picker, CSS editor
│   └── import/                  SCORM importer UI
└── lib/
    ├── db/                      Supabase clients
    ├── r2/                      Cloudflare R2 helpers
    └── scorm/
        ├── export/              Manifest, renderer, styles, ZIP builder
        ├── import/              SCORM ZIP parser, block mapper
        ├── theme-resolver.ts    Theme → CSS
        └── validator.ts         SCORM 1.2 conformance checker
```

---

## Block Library (38 types)

**Text & Media:** `text` `image` `video` `audio` `file_download` `embed` `divider` `spacer` `quote` `callout` `code_block` `annotated_image` `chart`

**Interactive:** `accordion` `tabs` `process` `timeline` `flashcards` `flip_cards` `hotspot` `labeled_graphic` `gallery` `carousel` `sorting_activity` `drag_drop`

**Layout:** `columns` `sidebar` `statement` `button` `button_stack` `checkbox_list` `numbered_list` `continue` `certificate`

**Questions:** `quiz` `knowledge_check` `survey` `scenario`

---

## SCORM Conformance Checklist (11 points)

| Check | Critical |
|---|---|
| imsmanifest.xml at ZIP root | ✓ |
| Schema declared as SCORM 1.2 | ✓ |
| Organization with title | ✓ |
| At least one SCO item | ✓ |
| All SCO resource files present | ✓ |
| SCORM API shim present | ✓ |
| LMSInitialize implemented | ✓ |
| LMSFinish implemented | ✓ |
| Lesson HTML references SCORM API | ✓ |
| No proprietary LMS extensions | — |
| Mastery score declared | — |

---

## Question Types

| Type | SCORM Interaction |
|---|---|
| Multiple choice | choice |
| Multiple select | choice |
| True / False | true-false |
| Fill in the blank | fill-in |
| Matching | matching |
| Ordering | sequencing |
| Numeric | numeric |
| Short answer | fill-in |
| Rating scale | likert |

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_DOMAIN` | Custom domain for public R2 assets |
| `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` | Same — exposed to client |
| `NEXT_PUBLIC_APP_URL` | Deployed app URL |

---

## Quick Start

```bash
git clone https://github.com/samfrost-dialog/authoring-platform.git
cd authoring-platform && npm install
cp .env.example apps/authoring/.env.local
npx supabase db push
cd apps/authoring && npm run dev
```