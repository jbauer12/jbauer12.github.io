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
