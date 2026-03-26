delete from public.admin_users
where user_id = 'ce380eaf-ab24-469b-a257-b5b13ed1513e';

insert into public.admin_users (user_id)
select id
from auth.users
where id = '76984fbd-edf9-4024-890c-6a43ec164ae6'
on conflict (user_id) do nothing;
