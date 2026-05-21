-- ============================================================
-- 002_rls_policies.sql
-- Row-Level Security — all tables locked down by org membership
-- ============================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

alter table organisations  enable row level security;
alter table themes         enable row level security;
alter table courses        enable row level security;
alter table lessons        enable row level security;
alter table blocks         enable row level security;
alter table quiz_attempts  enable row level security;
alter table org_users      enable row level security;

-- ── Helper: get current user's org_id and role ───────────────────────────────

create or replace function auth_org_id()
returns uuid language sql stable security definer as $$
  select org_id from org_users where user_id = auth.uid() limit 1;
$$;

create or replace function auth_org_role()
returns text language sql stable security definer as $$
  select role from org_users where user_id = auth.uid() limit 1;
$$;

-- ── org_users policies ────────────────────────────────────────────────────────

create policy "Users can read own org membership"
  on org_users for select
  using (user_id = auth.uid());

create policy "Org admins can manage org users"
  on org_users for all
  using (org_id = auth_org_id() and auth_org_role() = 'org_admin');

-- ── organisations policies ────────────────────────────────────────────────────

create policy "Members can read their organisation"
  on organisations for select
  using (id = auth_org_id());

create policy "Org admins can update organisation"
  on organisations for update
  using (id = auth_org_id() and auth_org_role() = 'org_admin');

-- ── themes policies ───────────────────────────────────────────────────────────

create policy "Members can read org themes"
  on themes for select
  using (org_id = auth_org_id());

create policy "Org admins can manage themes"
  on themes for all
  using (org_id = auth_org_id() and auth_org_role() = 'org_admin');

-- ── courses policies ──────────────────────────────────────────────────────────

create policy "Members can read org courses"
  on courses for select
  using (org_id = auth_org_id() and deleted_at is null);

create policy "Authors can create courses"
  on courses for insert
  with check (
    org_id = auth_org_id()
    and auth_org_role() in ('org_admin', 'author')
  );

create policy "Authors can update own courses, admins can update all"
  on courses for update
  using (
    org_id = auth_org_id()
    and (
      created_by = auth.uid()
      or auth_org_role() = 'org_admin'
    )
  );

create policy "Authors can delete own courses, admins can delete all"
  on courses for delete
  using (
    org_id = auth_org_id()
    and (
      created_by = auth.uid()
      or auth_org_role() = 'org_admin'
    )
  );

-- ── lessons policies ──────────────────────────────────────────────────────────

create policy "Members can read lessons in org courses"
  on lessons for select
  using (
    course_id in (
      select id from courses where org_id = auth_org_id() and deleted_at is null
    )
  );

create policy "Authors can manage lessons in their courses"
  on lessons for all
  using (
    course_id in (
      select id from courses
      where org_id = auth_org_id()
        and (created_by = auth.uid() or auth_org_role() = 'org_admin')
        and deleted_at is null
    )
  );

-- ── blocks policies ───────────────────────────────────────────────────────────

create policy "Members can read blocks in org courses"
  on blocks for select
  using (
    lesson_id in (
      select l.id from lessons l
      join courses c on c.id = l.course_id
      where c.org_id = auth_org_id() and c.deleted_at is null
    )
  );

create policy "Authors can manage blocks in their courses"
  on blocks for all
  using (
    lesson_id in (
      select l.id from lessons l
      join courses c on c.id = l.course_id
      where c.org_id = auth_org_id()
        and (c.created_by = auth.uid() or auth_org_role() = 'org_admin')
        and c.deleted_at is null
    )
  );

-- ── quiz_attempts policies ────────────────────────────────────────────────────
-- Attempts are written by the SCORM shim (unauthenticated learner context)
-- via service-role key from an API route. Org admins and authors can read.

create policy "Org members can read quiz attempts"
  on quiz_attempts for select
  using (
    course_id in (
      select id from courses where org_id = auth_org_id()
    )
  );

-- Insert is handled by service role only — no user-level insert policy needed
