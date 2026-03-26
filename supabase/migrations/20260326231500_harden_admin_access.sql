create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

drop policy if exists "Authenticated can insert events" on public.events;
drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
on public.events
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Authenticated can update events" on public.events;
drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
on public.events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated can delete events" on public.events;
drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
on public.events
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Authenticated can upload event images" on storage.objects;
drop policy if exists "Admins can upload event images" on storage.objects;
create policy "Admins can upload event images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'event-images' and public.is_admin());

drop policy if exists "Authenticated can update event images" on storage.objects;
drop policy if exists "Admins can update event images" on storage.objects;
create policy "Admins can update event images"
on storage.objects
for update
to authenticated
using (bucket_id = 'event-images' and public.is_admin())
with check (bucket_id = 'event-images' and public.is_admin());

drop policy if exists "Authenticated can delete event images" on storage.objects;
drop policy if exists "Admins can delete event images" on storage.objects;
create policy "Admins can delete event images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'event-images' and public.is_admin());

drop policy if exists "Authenticated can insert site content" on public.site_content;
drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
on public.site_content
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Authenticated can update site content" on public.site_content;
drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
on public.site_content
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content"
on public.site_content
for delete
to authenticated
using (public.is_admin());
