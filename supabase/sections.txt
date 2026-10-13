-- Add editable content for existing website pages. Safe to re-run.
create table if not exists public.content_sections (
  page text primary key check (page ~ '^[a-zA-Z0-9_/-]+[.]html$'),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.content_sections enable row level security;
revoke all on public.content_sections from anon, authenticated;
grant select (page,published,updated_at) on public.content_sections to anon;
grant select,insert,update,delete on public.content_sections to authenticated;
grant all on public.content_sections to service_role;
drop policy if exists sections_read on public.content_sections;
create policy sections_read on public.content_sections for select to anon
using (published is not null);
drop policy if exists sections_editor_read on public.content_sections;
create policy sections_editor_read on public.content_sections for select to authenticated
using ((select public.is_content_editor()));
drop policy if exists sections_insert on public.content_sections;
create policy sections_insert on public.content_sections for insert to authenticated
with check ((select public.is_content_editor()));
drop policy if exists sections_update on public.content_sections;
create policy sections_update on public.content_sections for update to authenticated
using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
drop policy if exists sections_delete on public.content_sections;
create policy sections_delete on public.content_sections for delete to authenticated
using ((select public.is_content_editor()));
drop trigger if exists content_sections_updated on public.content_sections;
create trigger content_sections_updated before update on public.content_sections
for each row execute function public.content_touch_updated_at();
