# Course Authoring Platform

No-code e-learning course builder — Rise Articulate replacement with SCORM 1.2 export.

**Stack:** Next.js 14 · Supabase · Cloudflare R2 · Vercel · GitHub Actions

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/authoring-platform.git
cd authoring-platform
npm install
```

### 2. Configure environment

```bash
cp .env.example apps/authoring/.env.local
# Fill in all values — see Environment Variables below
```

### 3. Set up Supabase

```bash
# Option A: Use hosted Supabase project (recommended)
# Point NEXT_PUBLIC_SUPABASE_URL to your project URL

# Option B: Run locally
npx supabase start

# Apply migrations
npx supabase db push
```

### 4. Configure Cloudflare R2 CORS

In your Cloudflare R2 bucket settings, add a CORS rule:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-vercel-deployment.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5. Run dev server

```bash
npm run dev
# App runs at http://localhost:3000
```

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
| `R2_PUBLIC_DOMAIN` | Custom domain for public assets |
| `NEXT_PUBLIC_APP_URL` | Deployed app URL |

---

## Project Structure

```
/
├── apps/authoring/        # Next.js app (editor, dashboard, API routes)
├── packages/
│   ├── block-schema/      # Zod schemas for all 30+ block types
│   └── scorm-runtime/     # SCORM 1.2 API shim (injected into exports)
└── supabase/
    └── migrations/        # Database schema + RLS policies
```

## Build Phases

| Phase | Status | Description |
|---|---|---|
| 1 — Core Authoring | 🔨 In progress | Editor shell, block library, media, autosave |
| 2 — Themes | ⏳ Planned | Theme editor, fonts, custom CSS |
| 3 — Quiz & Branching | ⏳ Planned | Quiz engine, scenarios, scoring |
| 4 — SCORM Export/Import | ⏳ Planned | Export packages, re-edit existing SCORM |

## GitHub Secrets Required

Add these to your GitHub repo secrets for CI/CD:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
