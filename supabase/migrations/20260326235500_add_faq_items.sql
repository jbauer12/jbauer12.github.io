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
