-- ============================================================
-- ReadLater 数据库 Schema
-- Supabase PostgreSQL
-- ============================================================

-- 用户扩展表（关联 auth.users）
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- 收藏内容表
create table if not exists public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  original_url    text not null,
  normalized_url  text not null,
  title           text not null,
  cover_url       text,
  platform        text not null check (platform in ('wechat', 'bilibili', 'douyin', 'other')),
  tag             text not null default '未分类',
  ai_summary      text,
  status          text not null default 'unread' check (status in ('unread', 'read')),
  is_broken       boolean not null default false,
  saved_at        timestamptz not null default now(),
  read_at         timestamptz,

  -- 同一用户不重复收藏相同内容
  unique(user_id, normalized_url)
);

create index if not exists idx_items_user_status on public.items(user_id, status);
create index if not exists idx_items_user_tag on public.items(user_id, tag);
create index if not exists idx_items_saved_at on public.items(user_id, saved_at desc);

-- 标签表
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),

  unique(user_id, name)
);

create index if not exists idx_tags_user on public.tags(user_id);

-- ============================================================
-- 自动创建 profile（用户注册时触发）
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS 行级安全策略
-- ============================================================

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.tags enable row level security;

-- profiles：用户只能看到自己的
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- items：用户只能操作自己的
create policy "Users can view own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can insert own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own items"
  on public.items for update
  using (auth.uid() = user_id);

create policy "Users can delete own items"
  on public.items for delete
  using (auth.uid() = user_id);

-- tags：用户只能操作自己的
create policy "Users can view own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tags"
  on public.tags for update
  using (auth.uid() = user_id);

create policy "Users can delete own tags"
  on public.tags for delete
  using (auth.uid() = user_id);
