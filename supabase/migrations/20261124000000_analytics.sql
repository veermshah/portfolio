-- First-party engagement tracking for veermickey.com and blog.veermickey.com.
-- Visitors can only insert; only the blog admin (and the service role / agents via the
-- Management API) can read. No cookies, IPs or user agents are stored.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null check (session_id ~ '^[a-z0-9]{8,32}$'),
  host text not null check (host in ('www.veermickey.com', 'veermickey.com', 'blog.veermickey.com')),
  path text not null check (char_length(path) between 1 and 300),
  type text not null check (type in ('pageview', 'section', 'scroll', 'click', 'outbound')),
  -- section id, link/button label or outbound URL
  target text check (char_length(target) <= 300),
  -- click position as a fraction of the document width/height
  x real check (x between 0 and 1),
  y real check (y between 0 and 1),
  -- section dwell ms, max scroll depth percent, or engaged ms for pageview
  value integer check (value between 0 and 86400000),
  viewport_w smallint check (viewport_w between 0 and 10000),
  doc_h integer check (doc_h between 0 and 1000000),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  referrer text check (char_length(referrer) <= 200),
  theme text check (theme in ('light', 'dark'))
);

create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_path_type_idx on public.analytics_events (path, type, created_at desc);

alter table public.analytics_events enable row level security;

create policy "Anyone can record events" on public.analytics_events
  for insert to anon, authenticated with check (created_at > now() - interval '1 minute');

create policy "Admin reads events" on public.analytics_events
  for select to authenticated using ((select public.is_blog_admin()));

revoke update, delete, truncate on public.analytics_events from anon, authenticated;

-- Rollups for quick reads. security_invoker keeps the table's RLS in force.
create view public.analytics_daily with (security_invoker = true) as
select date_trunc('day', created_at)::date as day, host, path,
       count(*) filter (where type = 'pageview' and target is null) as views,
       round(avg(value) filter (where type = 'pageview' and target = 'engaged'))::int as avg_engaged_ms,
       count(distinct session_id) as sessions
from public.analytics_events
group by 1, 2, 3;

create view public.analytics_sections with (security_invoker = true) as
select host, path, target as section,
       count(distinct session_id) as sessions_seen,
       round(avg(value))::int as avg_dwell_ms,
       percentile_cont(0.5) within group (order by value)::int as median_dwell_ms
from public.analytics_events
where type = 'section'
group by 1, 2, 3;

create view public.analytics_clicks with (security_invoker = true) as
select host, path, type, target, device, count(*) as clicks, count(distinct session_id) as sessions
from public.analytics_events
where type in ('click', 'outbound')
group by 1, 2, 3, 4, 5;
