export type InstanceRole = "owner" | "admin" | "member";

export type InstanceFeatures = {
  todos: boolean;
  notes: boolean;
  feeds: boolean;
  articles: boolean;
  newspaper: boolean;
};

export type InstanceSettings = {
  features: InstanceFeatures;
};

export type Instance = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings: InstanceSettings;
  created_at: string;
  updated_at: string;
};

export type InstanceMembership = {
  id: string;
  instance_id: string;
  user_id: string;
  role: InstanceRole;
  created_at: string;
  updated_at: string;
};

export type InstanceContext = {
  instance: Instance;
  role: InstanceRole;
  slug: string;
};
