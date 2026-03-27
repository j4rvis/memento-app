create table public.api_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  client_secret_hash text not null,
  instance_id uuid not null references public.instances(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index api_clients_instance_id_idx on public.api_clients(instance_id);
create index api_clients_client_id_idx on public.api_clients(client_id);

-- updated_at trigger
create trigger set_api_clients_updated_at
  before update on public.api_clients
  for each row execute function public.set_updated_at();

-- RLS
alter table public.api_clients enable row level security;

create policy "Instance members can view api_clients"
  on public.api_clients for select
  using (public.is_instance_member(instance_id));

create policy "Instance members can create api_clients"
  on public.api_clients for insert
  with check (
    (select auth.uid()) = user_id
    and public.is_instance_member(instance_id)
  );

create policy "Owners can update api_clients"
  on public.api_clients for update
  using (
    (select auth.uid()) = user_id
    and public.is_instance_member(instance_id)
  );

create policy "Owners can delete api_clients"
  on public.api_clients for delete
  using ((select auth.uid()) = user_id);
