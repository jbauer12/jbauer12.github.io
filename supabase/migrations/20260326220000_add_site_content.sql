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
