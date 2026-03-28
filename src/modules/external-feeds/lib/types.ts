export interface ExternalConnection {
  id: string;
  instance_id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_username: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

export interface ExternalFeed {
  id: string;
  instance_id: string;
  user_id: string;
  title: string;
  url: string;
  provider: string;
  external_connection_id: string | null;
  provider_resource_id: string | null;
  provider_resource_type: string | null;
  last_fetched_at: string | null;
  fetch_error: string | null;
}
