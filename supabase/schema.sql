-- Run in the Supabase SQL editor. This creates only the school content editor.
create table if not exists public.content_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);
create unique index if not exists content_editors_email on public.content_editors (lower(email));

create or replace function public.is_content_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.content_editors where user_id = (select auth.uid()) and role in ('owner','editor'));
$$;
create or replace function public.is_content_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.content_editors where user_id = (select auth.uid()) and role = 'owner');
$$;
revoke all on function public.is_content_editor() from public;
revoke all on function public.is_content_owner() from public;
grant execute on function public.is_content_editor(), public.is_content_owner() to anon, authenticated;

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('news','event')),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  date date,
  date_label_lt text not null default '',
  date_label_en text not null default '',
  title_lt text not null check (length(trim(title_lt)) between 1 and 250),
  title_en text not null check (length(trim(title_en)) between 1 and 250),
  summary_lt text not null default '',
  summary_en text not null default '',
  body_lt text not null default '',
  body_en text not null default '',
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  source_url text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.content_photos (
  id uuid primary key default gen_random_uuid(),
  url text not null check (length(url) between 1 and 2048),
  alt_lt text not null default '',
  alt_en text not null default '',
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.content_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists content_posts_updated on public.content_posts;
create trigger content_posts_updated before update on public.content_posts for each row execute function public.content_touch_updated_at();
drop trigger if exists content_photos_updated on public.content_photos;
create trigger content_photos_updated before update on public.content_photos for each row execute function public.content_touch_updated_at();

alter table public.content_editors enable row level security;
alter table public.content_posts enable row level security;
alter table public.content_photos enable row level security;
revoke all on public.content_editors, public.content_posts, public.content_photos from anon, authenticated;
grant select on public.content_editors to authenticated;
grant select on public.content_posts, public.content_photos to anon, authenticated;
grant insert, update, delete on public.content_posts, public.content_photos to authenticated;
grant all on public.content_editors, public.content_posts, public.content_photos to service_role;

drop policy if exists editors_read on public.content_editors;
create policy editors_read on public.content_editors for select to authenticated using (user_id = (select auth.uid()) or (select public.is_content_owner()));
drop policy if exists posts_read on public.content_posts;
create policy posts_read on public.content_posts for select to anon, authenticated using (status = 'published' or (select public.is_content_editor()));
drop policy if exists posts_insert on public.content_posts;
create policy posts_insert on public.content_posts for insert to authenticated with check ((select public.is_content_editor()));
drop policy if exists posts_update on public.content_posts;
create policy posts_update on public.content_posts for update to authenticated using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
drop policy if exists posts_delete on public.content_posts;
create policy posts_delete on public.content_posts for delete to authenticated using ((select public.is_content_editor()));
drop policy if exists photos_read on public.content_photos;
create policy photos_read on public.content_photos for select to anon, authenticated using (status = 'published' or (select public.is_content_editor()));
drop policy if exists photos_insert on public.content_photos;
create policy photos_insert on public.content_photos for insert to authenticated with check ((select public.is_content_editor()));
drop policy if exists photos_update on public.content_photos;
create policy photos_update on public.content_photos for update to authenticated using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
drop policy if exists photos_delete on public.content_photos;
create policy photos_delete on public.content_photos for delete to authenticated using ((select public.is_content_editor()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-photos','site-photos',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists site_photos_editor_read on storage.objects;
create policy site_photos_editor_read on storage.objects for select to authenticated using (bucket_id='site-photos' and (select public.is_content_editor()));
drop policy if exists site_photos_editor_upload on storage.objects;
create policy site_photos_editor_upload on storage.objects for insert to authenticated with check (bucket_id='site-photos' and (select public.is_content_editor()) and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists site_photos_editor_delete on storage.objects;
create policy site_photos_editor_delete on storage.objects for delete to authenticated using (bucket_id='site-photos' and (select public.is_content_editor()));
-- No storage UPDATE policy: uploads use unique names and never overwrite files.


-- Server-only, atomic rate limiting for editor PIN sign-in. Never stores PINs or raw email/IP.
create table if not exists public.content_login_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.content_login_limits enable row level security;
revoke all on public.content_login_limits from public, anon, authenticated;
create or replace function public.content_login_attempt(attempt_key text, attempt_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_attempts integer;
begin
  if attempt_key !~ '^[a-f0-9]{64}$' or attempt_limit not in (5,30) then return false; end if;
  insert into public.content_login_limits as limits (key,window_start,attempts)
  values (attempt_key,now(),1)
  on conflict (key) do update
  set window_start = case when limits.window_start <= now()-interval '15 minutes' then now() else limits.window_start end,
      attempts = case when limits.window_start <= now()-interval '15 minutes' then 1 else limits.attempts+1 end
  returning attempts into current_attempts;
  -- Remove old identities so the limiter does not accumulate indefinitely.
  delete from public.content_login_limits where window_start < now()-interval '1 day';
  return current_attempts <= attempt_limit;
end;
$$;
revoke all on function public.content_login_attempt(text,integer) from public, anon, authenticated;
grant execute on function public.content_login_attempt(text,integer) to service_role;
