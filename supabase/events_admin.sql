create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text not null default '/logo.jpg',
  starts_at text not null,
  venue text,
  address text,
  city text,
  organizer text,
  source_label text default 'Admin gepflegt',
  slug text not null unique,
  source_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_events_updated_at();

alter table public.events enable row level security;

drop policy if exists "Public can view events" on public.events;
create policy "Public can view events"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can insert events" on public.events;
create policy "Authenticated can insert events"
on public.events
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update events" on public.events;
create policy "Authenticated can update events"
on public.events
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete events" on public.events;
create policy "Authenticated can delete events"
on public.events
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can view event images" on storage.objects;
create policy "Public can view event images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-images');

drop policy if exists "Authenticated can upload event images" on storage.objects;
create policy "Authenticated can upload event images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'event-images');

drop policy if exists "Authenticated can update event images" on storage.objects;
create policy "Authenticated can update event images"
on storage.objects
for update
to authenticated
using (bucket_id = 'event-images')
with check (bucket_id = 'event-images');

drop policy if exists "Authenticated can delete event images" on storage.objects;
create policy "Authenticated can delete event images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'event-images');

create table if not exists public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_site_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists site_content_set_updated_at on public.site_content;

create trigger site_content_set_updated_at
before update on public.site_content
for each row
execute function public.set_site_content_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "Public can view site content" on public.site_content;
create policy "Public can view site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can insert site content" on public.site_content;
create policy "Authenticated can insert site content"
on public.site_content
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update site content" on public.site_content;
create policy "Authenticated can update site content"
on public.site_content
for update
to authenticated
using (true)
with check (true);
