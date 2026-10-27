alter table public.myuni_courses
  add column if not exists is_featured boolean not null default false;

create index if not exists myuni_courses_featured_active_idx
  on public.myuni_courses (created_at desc)
  where is_active is true and is_featured is true;
