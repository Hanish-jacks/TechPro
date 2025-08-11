-- Create posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.posts enable row level security;

-- Policies
create policy if not exists "Anyone can view posts"
  on public.posts for select
  using (true);

create policy if not exists "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_posts_created_at on public.posts (created_at);
create index if not exists idx_posts_user_id on public.posts (user_id);

-- Function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for posts.updated_at
create trigger if not exists set_posts_updated_at
before update on public.posts
for each row execute function public.update_updated_at_column();

-- Create storage bucket for post images
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Storage policies for post-images
create policy if not exists "Public read for post images" on storage.objects
  for select using (bucket_id = 'post-images');

create policy if not exists "Users can upload post images" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy if not exists "Users can update their post images" on storage.objects
  for update using (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy if not exists "Users can delete their post images" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );