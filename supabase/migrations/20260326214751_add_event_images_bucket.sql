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
