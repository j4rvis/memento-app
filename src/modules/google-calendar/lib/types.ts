export interface GoogleAccount {
  id: string;
  user_id: string;
  instance_id: string;
  google_email: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarEvent {
  id: string;
  google_account_id: string;
  instance_id: string;
  user_id: string;
  google_event_id: string;
  calendar_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string | null;
  color: string | null;
  recurrence: string[] | null;
  synced_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleCalendarApiEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  colorId?: string;
  recurrence?: string[];
}

export interface GoogleCalendar {
  id: string;
  google_account_id: string;
  instance_id: string;
  user_id: string;
  google_calendar_id: string;
  name: string;
  color: string | null;
  description: string | null;
  access_role: string | null;
  synced_at: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  accessRole: string;
}
