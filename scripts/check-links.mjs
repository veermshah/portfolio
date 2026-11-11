// Checks links in the built site.
//
//   node scripts/check-links.mjs             internal links only (fails the run on any miss)
//   node scripts/check-links.mjs --external  also requests every external link
//
// Run `npm run build` first. Internal links must resolve to a file in dist/.
// External links must end in a 2xx after redirects. Some sites block scripted
// requests (LinkedIn answers 999) or rate-limit them (429); those are reported
// as warnings, not failures.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const external = process.argv.includes('--external');
const BOT_BLOCKERS = ['linkedin.com'];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveInternal(pathname) {
  const clean = decodeURIComponent(pathname.split('#')[0].split('?')[0]);
  const base = join(DIST, clean);
  const candidates = clean.endsWith('/')
    ? [join(base, 'index.html')]
    : [base, `${base}.html`, join(base, 'index.html')];
  for (const c of candidates) if (await exists(c)) return true;
  return false;
}

const pages = await walk(DIST);
const internalMisses = [];
const externalLinks = new Map(); // url -> first page that uses it
let internalCount = 0;

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const from = '/' + relative(DIST, page);
  for (const [, attr, raw] of html.matchAll(/\s(href|src|srcset)="([^"]+)"/g)) {
    const urls = attr === 'srcset' ? raw.split(',').map((s) => s.trim().split(/\s+/)[0]) : [raw];
    for (const url of urls) {
      if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('data:')) continue;
      if (/^https?:\/\//.test(url)) {
        if (!externalLinks.has(url)) externalLinks.set(url, from);
        continue;
      }
      if (url.startsWith('/')) {
        internalCount++;
        if (!(await resolveInternal(url))) internalMisses.push(`${from} -> ${url}`);
      }
    }
  }
}

console.log(`Checked ${internalCount} internal links on ${pages.length} pages.`);
if (internalMisses.length) {
  console.error(`\n${internalMisses.length} broken internal link(s):`);
  for (const m of internalMisses) console.error(`  ${m}`);
}

let externalFailures = 0;
if (external) {
  // Canonical/OG URLs point at the production origin, which may not be live yet; skip them.
  const site = (process.env.SITE_URL ?? 'https://portfolio-wheat-xi-reyo27zre0.vercel.app').replace(/\/$/, '');
  const urls = [...externalLinks.keys()].filter((u) => !u.startsWith(site));
  console.log(`\nRequesting ${urls.length} external links...`);
  const results = await Promise.all(
    urls.map(async (url) => {
      const opts = { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (link check)' }, signal: AbortSignal.timeout(20000) };
      try {
        let res = await fetch(url, { ...opts, method: 'HEAD' });
        if (res.status >= 400) res = await fetch(url, { ...opts, method: 'GET' });
        return { url, status: res.status };
      } catch (err) {
        return { url, status: 0, error: err.cause?.code ?? err.name };
      }
    }),
  );
  for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
    const ok = r.status >= 200 && r.status < 300;
    const blocked = r.status === 429 || BOT_BLOCKERS.some((d) => r.url.includes(d));
    const tag = ok ? 'ok  ' : blocked ? 'warn' : 'FAIL';
    if (!ok && !blocked) externalFailures++;
    if (!ok || process.argv.includes('--verbose')) console.log(`  ${tag} ${r.status || r.error} ${r.url}`);
  }
  console.log(`${results.length - externalFailures} of ${results.length} external links OK.`);
}

if (internalMisses.length || externalFailures) process.exit(1);
