-- ============================================================
-- 001_initial_schema.sql
-- Custom Course Authoring Platform — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Themes ────────────────────────────────────────────────────────────────────
-- Defined before organisations so org can reference it

create table themes (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid, -- set after organisations is created
  name             text not null,
  primary_color    text default '#4F46E5',
  secondary_color  text default '#7C3AED',
  accent_color     text default '#06B6D4',
  background_color text default '#FFFFFF',
  text_color       text default '#111827',
  heading_font     text default 'Inter',
  body_font        text default 'Inter',
  button_style     jsonb default '{"borderRadius": "0.375rem", "padding": "regular", "shadow": false}'::jsonb,
  logo_url         text,
  cover_style      text default 'gradient' check (cover_style in ('gradient','image','solid','video')),
  custom_css       text,
  created_at       timestamptz default now()
);

-- ── Organisations ─────────────────────────────────────────────────────────────

create table organisations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  theme_id   uuid references themes(id) on delete set null,
  created_at timestamptz default now()
);

-- Now wire themes back to organisations
alter table themes
  add constraint themes_org_id_fkey
  foreign key (org_id) references organisations(id) on delete cascade;

-- ── Courses ───────────────────────────────────────────────────────────────────

create table courses (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  title            text not null,
  description      text,
  cover_image_url  text,
  theme_id         uuid references themes(id) on delete set null,
  status           text not null default 'draft'
                     check (status in ('draft','published','archived')),
  scorm_version    text not null default 'scorm_1.2',
  metadata         jsonb default '{}'::jsonb,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  deleted_at       timestamptz -- soft delete
);

create index courses_org_id_idx  on courses(org_id);
create index courses_status_idx  on courses(status);
create index courses_deleted_idx on courses(deleted_at) where deleted_at is null;

-- ── Lessons ───────────────────────────────────────────────────────────────────

create table lessons (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references courses(id) on delete cascade,
  title             text not null,
  position          integer not null,
  is_section_header boolean not null default false,
  created_at        timestamptz default now(),
  unique (course_id, position)
);

create index lessons_course_id_idx on lessons(course_id);

-- ── Blocks ────────────────────────────────────────────────────────────────────

create table blocks (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references lessons(id) on delete cascade,
  type       text not null,
  position   integer not null,
  content    jsonb not null default '{}'::jsonb,
  settings   jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (lesson_id, position)
);

create index blocks_lesson_id_idx on blocks(lesson_id);
create index blocks_type_idx      on blocks(type);

-- ── Quiz Attempts (SCORM tracking — LMS-agnostic) ────────────────────────────

create table quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses(id) on delete cascade,
  learner_id     text not null, -- opaque LMS-supplied identifier
  score_raw      numeric,
  score_max      numeric default 100,
  score_min      numeric default 0,
  lesson_status  text, -- SCORM 1.2 lesson_status value
  suspend_data   text, -- max 4096 chars per SCORM 1.2 spec
  started_at     timestamptz default now(),
  completed_at   timestamptz
);

create index quiz_attempts_course_id_idx   on quiz_attempts(course_id);
create index quiz_attempts_learner_id_idx  on quiz_attempts(learner_id);

-- ── org_users (maps Supabase auth users to orgs with roles) ──────────────────

create table org_users (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'author'
               check (role in ('org_admin','author','reviewer','viewer')),
  created_at timestamptz default now(),
  unique (org_id, user_id)
);

create index org_users_user_id_idx on org_users(user_id);
create index org_users_org_id_idx  on org_users(org_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger courses_updated_at
  before update on courses
  for each row execute procedure set_updated_at();
