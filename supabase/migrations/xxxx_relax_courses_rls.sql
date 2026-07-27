-- Relax `courses` RLS: course metadata becomes a public catalog so Free
-- users can browse locked courses and get upsold. The real gate stays on
-- `lessons`, which is the actual content being sold — its RLS is untouched.
--
-- Rename this file to match your migration numbering convention
-- (e.g. supabase/migrations/00006_relax_courses_rls.sql).

-- Confirmed against xxxx_create_courses.sql: courses has no `is_active`
-- column, and the existing policy is named "courses_select_by_tier".
drop policy if exists "courses_select_by_tier" on public.courses;

-- Anyone — anon or authenticated — can view all course metadata.
-- (Dashboard routes are auth-gated anyway, but this also lets you build a
-- public marketing/browse page later without touching RLS again.)
create policy "courses_select_public"
  on public.courses
  for select
  to anon, authenticated
  using (true);

-- `lessons` RLS ("lessons_select_by_parent_course_tier") is intentionally
-- left as-is — that's where the real tier gate belongs.
