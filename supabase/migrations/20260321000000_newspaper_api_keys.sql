-- Migration: newspaper_api_keys
-- Adds API key table for headless access to newspaper PDF endpoints

create table newspaper_api_keys (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references instances(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  key_hash     text not null unique,
  scopes       text[] not null default '{"read:pdf"}',
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

alter table newspaper_api_keys enable row level security;

create policy "Users can view their own API keys"
  on newspaper_api_keys for select
  using (
    (select auth.uid()) = user_id
    and is_instance_member(instance_id)
  );

create policy "Users can create API keys for their instance"
  on newspaper_api_keys for insert
  with check (
    (select auth.uid()) = user_id
    and is_instance_member(instance_id)
  );

create policy "Users can delete their own API keys"
  on newspaper_api_keys for delete
  using (
    (select auth.uid()) = user_id
  );

create index idx_newspaper_api_keys_instance_id on newspaper_api_keys(instance_id);
create index idx_newspaper_api_keys_user_id on newspaper_api_keys(user_id);
