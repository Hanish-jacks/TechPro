-- Create likes table
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;

create policy "Anyone can view post likes"
  on public.post_likes
  for select
  using (true);

create policy "Users can like posts (insert own like)"
  on public.post_likes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their likes"
  on public.post_likes
  for delete
  using (auth.uid() = user_id);

create unique index if not exists idx_post_likes_unique on public.post_likes (post_id, user_id);
create index if not exists idx_post_likes_post_id on public.post_likes (post_id);

-- Create comments table
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "Anyone can view post comments"
  on public.post_comments
  for select
  using (true);

create policy "Users can create their own comments"
  on public.post_comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.post_comments
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.post_comments
  for delete
  using (auth.uid() = user_id);

-- Trigger to maintain updated_at
drop trigger if exists update_post_comments_updated_at on public.post_comments;
create trigger update_post_comments_updated_at
before update on public.post_comments
for each row execute function public.update_updated_at_column();

create index if not exists idx_post_comments_post_id on public.post_comments (post_id);
create index if not exists idx_post_comments_post_created_at on public.post_comments (post_id, created_at desc);

-- Views for counts
create or replace view public.post_like_counts as
select post_id, count(*)::bigint as like_count
from public.post_likes
group by post_id;

create or replace view public.post_comment_counts as
select post_id, count(*)::bigint as comment_count
from public.post_comments
group by post_id;