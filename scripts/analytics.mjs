// Engagement report for agents and the site owner. Reads the private analytics tables through the
// Supabase Management API, so it needs SUPABASE_ACCESS_TOKEN (a personal access token).
//   npm run analytics            last 7 days
//   npm run analytics -- 30      last 30 days
//   npm run analytics -- --sql "select count(*) from analytics_events"
const ref = process.env.SUPABASE_PROJECT_REF ?? 'mpkciowvhbwkoucrhdap';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN (Supabase personal access token).');
  process.exit(1);
}

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

const args = process.argv.slice(2);
if (args[0] === '--sql') {
  console.table(await sql(args.slice(1).join(' ')));
  process.exit(0);
}

const days = Number(args[0] ?? 7);
if (!Number.isFinite(days) || days <= 0) throw new Error('Days must be a positive number.');
const since = `created_at > now() - interval '${days} days'`;
const visits = `select host, path, session_id,
    count(*) filter (where type='pageview' and target is null) as views,
    sum(value) filter (where type='pageview' and target='engaged') as engaged_ms,
    max(value) filter (where type='scroll') as scroll_pct
    from analytics_events where ${since} group by 1, 2, 3`;
const reports = {
  Overview: `select coalesce(sum(views), 0) as views, count(distinct session_id) as sessions,
    round(percentile_cont(0.5) within group (order by engaged_ms)::numeric / 1000, 1) as median_engaged_s,
    percentile_cont(0.5) within group (order by scroll_pct) as median_scroll_pct
    from (${visits}) v`,
  Pages: `select host, path, sum(views) as views, count(distinct session_id) as sessions,
    percentile_cont(0.5) within group (order by scroll_pct) as median_scroll_pct
    from (${visits}) v group by 1, 2 order by views desc limit 25`,
  Sections: `select path, target as section, count(distinct session_id) as sessions, round(percentile_cont(0.5) within group (order by value)::numeric / 1000, 1) as median_s
    from analytics_events where type='section' and ${since} group by 1, 2 order by sessions desc limit 30`,
  Clicks: `select path, type, target, count(*) as clicks from analytics_events where type in ('click','outbound') and ${since}
    group by 1, 2, 3 order by clicks desc limit 30`,
  Referrers: `select coalesce(referrer, 'direct') as referrer, count(*) as views from analytics_events
    where type='pageview' and target is null and ${since} group by 1 order by views desc limit 15`,
  Devices: `select device, count(*) as views from analytics_events where type='pageview' and target is null and ${since} group by 1 order by views desc`,
};

for (const [title, query] of Object.entries(reports)) {
  console.log(`\n${title} (last ${days} days)`);
  console.table(await sql(query));
}
