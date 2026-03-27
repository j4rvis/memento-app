-- google_accounts: stores OAuth tokens per user per instance
create table google_accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  instance_id      uuid not null references instances(id) on delete cascade,
  google_email     text not null,
  access_token     text not null,
  refresh_token    text,
  token_expires_at timestamptz not null,
  scopes           text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, instance_id, google_email)
);

alter table google_accounts enable row level security;

create policy "Users can view their own Google accounts"
  on google_accounts for select
  using (
    (select auth.uid()) = user_id
    and is_instance_member(instance_id)
  );

create policy "Users can delete their own Google accounts"
  on google_accounts for delete
  using (
    (select auth.uid()) = user_id
  );

create index idx_google_accounts_user_id on google_accounts(user_id);
create index idx_google_accounts_instance_id on google_accounts(instance_id);

create trigger set_google_accounts_updated_at
  before update on google_accounts
  for each row execute function set_updated_at();

-- google_calendar_events: synced event cache
create table google_calendar_events (
  id                uuid primary key default gen_random_uuid(),
  google_account_id uuid not null references google_accounts(id) on delete cascade,
  instance_id       uuid not null references instances(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  google_event_id   text not null,
  calendar_id       text not null default 'primary',
  title             text not null,
  description       text,
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  all_day           boolean not null default false,
  location          text,
  color             text,
  recurrence        text[],
  synced_at         timestamptz not null default now(),
  unique (google_account_id, google_event_id)
);

alter table google_calendar_events enable row level security;

create policy "Users can view their own calendar events"
  on google_calendar_events for select
  using (
    (select auth.uid()) = user_id
    and is_instance_member(instance_id)
  );

create index idx_google_calendar_events_account_id on google_calendar_events(google_account_id);
create index idx_google_calendar_events_instance_id on google_calendar_events(instance_id);
create index idx_google_calendar_events_start_at on google_calendar_events(start_at);
