-- Notification Tokens Table
-- Stores device push tokens for sending notifications

create table public.notification_tokens (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  device_id text,
  os_type text not null check (os_type in ('ios', 'android')),
  os_version text,
  app_version text,
  registered_at timestamp with time zone default now(),
  last_refreshed_at timestamp with time zone default now(),
  is_valid boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint unique_user_device unique(user_id, device_id)
);

-- Notification Preferences Table
-- Stores user notification settings and preferences

create table public.notification_preferences (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  
  -- Global enable/disable
  enabled boolean default true,
  
  -- Daily reminder settings
  daily_reminder jsonb default '{"enabled": true, "time": "21:00", "timezone": "UTC"}',
  
  -- Weekly report settings
  weekly_report jsonb default '{"enabled": true, "dayOfWeek": 0, "time": "10:00", "timezone": "UTC"}',
  
  -- Monthly report settings
  monthly_report jsonb default '{"enabled": true, "dayOfMonth": 1, "time": "08:00", "timezone": "UTC"}',
  
  -- Budget alerts
  budget_alerts jsonb default '{"enabled": true, "warningPercentage": 80, "alertSound": true, "vibration": true}',
  
  -- Spending anomalies detection
  spending_anomalies jsonb default '{"enabled": true, "threshold": 150}',
  
  -- Daily budget notification
  daily_budget_notif jsonb default '{"enabled": true, "time": "00:00"}',
  
  -- Achievements notifications
  achievements jsonb default '{"enabled": true}',
  
  -- Account balance alerts
  account_alerts jsonb default '{"enabled": true, "lowBalanceThreshold": 10}',
  
  -- Do not disturb settings
  do_not_disturb jsonb default '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}',
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Notification Events Table (Optional - for analytics)
-- Tracks notification interactions and analytics

create table public.notification_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  action text not null check (action in ('received', 'interacted', 'dropped')),
  action_id text,
  timestamp timestamp with time zone default now(),
  data jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index idx_notification_tokens_user_id on notification_tokens(user_id);
create index idx_notification_tokens_device_id on notification_tokens(device_id);
create index idx_notification_preferences_user_id on notification_preferences(user_id);
create index idx_notification_events_user_id on notification_events(user_id);
create index idx_notification_events_type on notification_events(notification_type);
create index idx_notification_events_timestamp on notification_events(timestamp);

-- Row Level Security Policies

-- Enable RLS
alter table public.notification_tokens enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;

-- notification_tokens policies
create policy "Users can read their own tokens"
  on notification_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
  on notification_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tokens"
  on notification_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tokens"
  on notification_tokens for delete
  using (auth.uid() = user_id);

-- notification_preferences policies
create policy "Users can read their own preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete their own preferences"
  on notification_preferences for delete
  using (auth.uid() = user_id);

-- notification_events policies
create policy "Users can read their own events"
  on notification_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on notification_events for insert
  with check (auth.uid() = user_id);

-- Grant permissions
grant select, insert, update, delete on notification_tokens to authenticated;
grant select, insert, update, delete on notification_preferences to authenticated;
grant select, insert on notification_events to authenticated;
