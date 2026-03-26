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

alter table public.events enable row level security;

drop policy if exists "Public can view events" on public.events;
create policy "Public can view events"
on public.events
for select
to anon, authenticated
using (true);

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

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_faq_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists faq_items_set_updated_at on public.faq_items;

create trigger faq_items_set_updated_at
before update on public.faq_items
for each row
execute function public.set_faq_items_updated_at();

alter table public.faq_items enable row level security;

drop policy if exists "Public can view faq items" on public.faq_items;
create policy "Public can view faq items"
on public.faq_items
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert faq items" on public.faq_items;
create policy "Admins can insert faq items"
on public.faq_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update faq items" on public.faq_items;
create policy "Admins can update faq items"
on public.faq_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete faq items" on public.faq_items;
create policy "Admins can delete faq items"
on public.faq_items
for delete
to authenticated
using (public.is_admin());

insert into public.faq_items (question, answer, sort_order)
select seed.question, seed.answer, seed.sort_order
from (
  values
    (
      'Was soll hier fuer Veranstaltungen auftauchen?',
      'Im Fokus stehen DIY-Konzertabende, offene Sessions und Formate, die Jugend- und Subkultur in Viechtach sichtbar machen. Die Seite soll diese Termine kuenftig gesammelt und klar lesbar zeigen.',
      0
    ),
    (
      'Wo erfahre ich aktuelle Termine, solange die Seite weiter waechst?',
      'Bis alle Inhalte final eingebunden sind, laufen kurzfristige Hinweise weiterhin am schnellsten ueber Instagram und Facebook. Die neue Events-Seite bereitet aber genau diesen Wechsel vor.',
      1
    ),
    (
      'Kann ich mit einer Band oder einem Format anfragen?',
      'Ja. Am besten kurz und direkt per Mail oder ueber Instagram schreiben: Wer seid ihr, was spielt ihr, und was fuer einen Rahmen sucht ihr?',
      2
    ),
    (
      'Warum sieht die Seite so reduziert aus?',
      'Weil sie naeher an Flyern, Clubwaenden und direkter Kommunikation bleiben soll als an einem glatten Event-Portal. Der Auftritt darf roh sein, solange er klar funktioniert.',
      3
    ),
    (
      'Wie kann ich den Verein unterstuetzen?',
      'Mitgliedschaft ist ein Weg. Dazu kommen Hilfe bei Aufbau, Awareness, Technik, Orga, Einlass oder einfach regelmaessiges Mittragen von Abenden und Strukturen.',
      4
    )
) as seed(question, answer, sort_order)
where not exists (
  select 1
  from public.faq_items
);

-- Example:
-- insert into public.admin_users (user_id, email)
-- values ('00000000-0000-0000-0000-000000000000', 'admin@example.com')
-- on conflict (user_id) do update
-- set email = excluded.email;

insert into public.admin_users (user_id)
select id
from auth.users
where id = '76984fbd-edf9-4024-890c-6a43ec164ae6'
on conflict (user_id) do nothing;
