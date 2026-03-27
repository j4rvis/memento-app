create table google_calendars (
  id                uuid primary key default gen_random_uuid(),
  google_account_id uuid not null references google_accounts(id) on delete cascade,
  instance_id       uuid not null references instances(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  google_calendar_id text not null,   -- opaque Google ID, e.g. 'primary' or 'abc@group.calendar.google.com'
  name              text not null,
  color             text,             -- hex, e.g. '#4285F4' from calendarList.backgroundColor
  description       text,
  access_role       text,
  synced_at         timestamptz not null default now(),
  unique (google_account_id, google_calendar_id)
);

alter table google_calendars enable row level security;

create policy "Users can view their own Google calendars"
  on google_calendars for select
  using ((select auth.uid()) = user_id and is_instance_member(instance_id));

create index idx_google_calendars_account_id on google_calendars(google_account_id);
