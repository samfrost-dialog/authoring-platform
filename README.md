# Course Authoring Platform

A self-hosted, no-code course authoring platform replacing Rise Articulate Pro/Enterprise. Built on the same stack as your existing LMS.

**Stack:** Next.js 16 · Supabase · Cloudflare R2 · Vercel · GitHub Actions

---

## Current Status

### ✅ Phase 1 — Core Authoring Platform (Complete)

| Milestone | Status | Notes |
|---|---|---|
| 1a — Scaffold | ✅ | Monorepo, Supabase schema, R2 bucket, GitHub Actions CI |
| 1b — Auth & Dashboard | ✅ | Supabase Auth, org/course list, create/delete course |
| 1c — Editor Shell | ✅ | Three-panel layout, lesson outline, block canvas, dnd-kit |
| 1d — Block Library | ✅ | All 38 block types, Tiptap rich text editor |
| 1e — Media Uploads | ✅ | R2 presigned upload, image/video/audio/file blocks |
| 1f — Autosave | ✅ | 1s debounce, animated save indicator |
| 1g — Preview | ✅ | Standalone lesson preview with lesson nav and progress |

### ✅ Phase 2 — Themes & Branding (Complete)

| Milestone | Status | Notes |
|---|---|---|
| 2a — Theme Editor | ✅ | Full settings UI with live miniature course preview |
| 2b — Font System | ✅ | Searchable Google Fonts picker + custom font upload to R2 |
| 2c — Custom CSS | ✅ | CodeMirror editor with CSS syntax highlighting |
| 2d — Theme Apply | ✅ | Theme applied in preview; theme picker in editor toolbar |

### 🔨 Phase 3 — Quiz & Branching Engine (In Progress)

| Milestone | Status | Notes |
|---|---|---|
| 3a — Quiz Builder | ✅ | All 9 question types with editor UI |
| 3b — Quiz Runtime | ✅ | Client-side scoring, feedback, pass/fail, retry |
| 3c — Branching | ✅ | Scene graph editor, path tracking, outcome scenes |
| 3d — Knowledge Checks | ⏳ | Pending |
| 3e — SCORM tracking | ⏳ | cmi.interactions, score, lesson_status wired to quiz engine |

### ⏳ Phase 4 — SCORM Export & Import (Planned)

| Milestone | Status | Notes |
|---|---|---|
| 4a — HTML Renderer | ⏳ | Server-side lesson-to-HTML for all block types |
| 4b — SCORM Manifest | ⏳ | imsmanifest.xml generation, SCO per lesson |
| 4c — API Shim | ⏳ | Full SCORM 1.2 LMSInitialize/Commit/Finish (built, not wired) |
| 4d — ZIP + R2 | ⏳ | Package build, upload to R2, signed download URL |
| 4e — SCORM Import | ⏳ | ZIP parse, HTML-to-block mapping, media migration |
| 4f — QA | ⏳ | Test against Moodle, TalentLMS, SCORM Cloud validator |

---

## Architecture

```
/
├── apps/authoring/                  # Next.js 16 authoring app (Vercel)
│   ├── app/
│   │   ├── (auth)/login,signup      # Auth pages
│   │   ├── dashboard/               # Course library
│   │   ├── dashboard/themes/        # Theme manager
│   │   ├── editor/[id]/             # Course editor
│   │   ├── preview/[id]/            # Learner preview
│   │   └── api/
│   │       ├── courses/[id]/        # Course metadata PATCH
│   │       ├── media/sign,delete/   # R2 presigned URLs
│   │       ├── themes/              # Theme CRUD
│   │       └── fonts/sign/          # Font upload
│   ├── components/
│   │   ├── editor/                  # Editor shell, toolbar, inspector, Tiptap
│   │   ├── preview/                 # Preview shell and block renderer
│   │   ├── dashboard/               # Course grid, nav, new course modal
│   │   ├── quiz/                    # Quiz builder/runtime, scenario builder/runtime
│   │   └── themes/                  # Theme editor, preview, font picker, CSS editor
│   └── lib/
│       ├── db/                      # Supabase server + browser clients
│       ├── r2/                      # Cloudflare R2 helpers
│       └── scorm/                   # Theme resolver (SCORM export coming Phase 4)
├── packages/
│   ├── block-schema/                # Zod schemas for all 38 block types + DB types
│   └── scorm-runtime/               # SCORM 1.2 API shim (injected into exports)
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql   # All 7 tables
        └── 002_rls_policies.sql     # Org-scoped RLS
```

---

## Block Library (38 types)

### Text & Media
`text` `image` `video` `audio` `file_download` `embed` `divider` `spacer` `quote` `callout` `code_block` `annotated_image` `chart`

### Interactive
`accordion` `tabs` `process` `timeline` `flashcards` `flip_cards` `hotspot` `labeled_graphic` `gallery` `carousel` `sorting_activity` `drag_drop`

### Layout
`columns` `sidebar` `statement` `button` `button_stack` `checkbox_list` `numbered_list` `continue` `certificate`

### Questions
`quiz` `knowledge_check` `survey` `scenario`

---

## Question Types (quiz + knowledge_check)

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

## Routes

| Route | Description |
|---|---|
| `/login` `/signup` | Auth |
| `/dashboard` | Course library |
| `/dashboard/themes` | Theme manager |
| `/editor/[id]` | Course editor |
| `/preview/[id]` | Learner preview |
| `/api/courses/[id]` | Update course metadata |
| `/api/media/sign` `/delete` | R2 media upload |
| `/api/themes` `/[id]` | Theme CRUD |
| `/api/fonts/sign` | Font upload |
| `/auth/callback` | Supabase email confirmation |

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
cd authoring-platform
npm install
cp .env.example apps/authoring/.env.local
# Fill in .env.local with your values
npx supabase db push
cd apps/authoring && npm run dev
```

## R2 CORS Configuration

Add to your Cloudflare R2 bucket:

```json
[{
  "AllowedOrigins": ["http://localhost:3000", "https://your-vercel-deployment.vercel.app"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}]
```

## GitHub Secrets Required

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `VERCEL_TOKEN` · `VERCEL_ORG_ID` · `VERCEL_PROJECT_ID`