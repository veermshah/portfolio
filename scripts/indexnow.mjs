// Tells IndexNow (Bing, Yandex, Seznam, Naver and others) that the pages in the sitemap changed.
//
//   npm run indexnow             submit every URL in the live sitemap of www.veermickey.com
//   npm run indexnow -- --local  read the URLs from dist/ instead (run `npm run build` first)
//   npm run indexnow -- --dry-run  list the URLs without submitting
//
// The key is public by design: IndexNow checks that https://www.veermickey.com/<key>.txt holds it.
// It lives in public/<key>.txt; to rotate it, replace that file with a new 32-character hex name and content.

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://www.veermickey.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const local = process.argv.includes('--local');
const dryRun = process.argv.includes('--dry-run');

const publicDir = new URL('../public/', import.meta.url).pathname;
const keyFile = (await readdir(publicDir)).find((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (!keyFile) throw new Error('No IndexNow key file (public/<32 hex characters>.txt) found.');
const key = keyFile.replace(/\.txt$/, '');
if ((await readFile(join(publicDir, keyFile), 'utf8')).trim() !== key) throw new Error(`${keyFile} must contain exactly its own name.`);

const distRoot = new URL('../dist/', import.meta.url).pathname;
const dist = existsSync(join(distRoot, 'client')) ? join(distRoot, 'client') : distRoot;
const read = async (url) => {
  if (local) return readFile(join(dist, new URL(url).pathname), 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
};
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));

// The sitemap index lists one or more sitemaps; each lists page URLs.
const index = await read(`${ORIGIN}/sitemap-index.xml`);
const urls = [];
for (const sitemap of locs(index)) urls.push(...locs(await read(sitemap)));
const urlList = [...new Set(urls)].filter((u) => u.startsWith(`${ORIGIN}/`));
if (!urlList.length) throw new Error('The sitemap listed no URLs.');

if (dryRun) {
  console.log(urlList.join('\n'));
  console.log(`\n${urlList.length} URLs, key ${key} (dry run, nothing sent)`);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(ORIGIN).host, key, keyLocation: `${ORIGIN}/${keyFile}`, urlList }),
});
// 200 and 202 both mean accepted (202: the key is still being verified).
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
