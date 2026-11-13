# portfolio

My portfolio site: a short intro and fifteen projects, each with its own write-up page.

Static [Astro](https://astro.build) with hand-written CSS. No client-side JavaScript, no trackers. Deployed on Vercel.

## Run it

Requires Node 22 or newer.

```sh
npm install
npm run dev            # http://localhost:4321
npm run build          # static site in dist/
npm run preview        # serve dist/ locally
npm run check:links    # internal links in dist/ (run after build)
npm run check:external # internal links plus a request to every external link
```

## Edit projects

All project content is in [`src/data/projects.ts`](src/data/projects.ts). The home page lists projects in array order, so reordering is moving an entry. Each entry has:

| field | what it does |
|---|---|
| `slug` | URL of the write-up: `/projects/<slug>/` |
| `title`, `pitch` | name and one line for the home page |
| `award` | optional badge, e.g. `1st Place, HackFin` |
| `context` | optional hackathon or course name |
| `role` | `{ kind: 'Solo' }` or `{ kind: 'Team', size, mine }`, where `mine` is what I did |
| `stack` | tags |
| `live`, `code` | links. Leave `live` out if there is no hosted version |
| `codePrivate` | `true` shows "Code (soon)" with no link. Remove it once the repo is public |
| `extra` | more links on the project page (reports, videos, Devpost) |
| `problem`, `built`, `results` | the write-up. Backticks render as inline code. Results use real numbers from the repo only |
| `images` | file names in `src/assets/projects/<slug>/` with alt text and an optional caption. The first image goes above the write-up |

Images are converted to responsive WebP at build time. Drop a PNG, JPG or WebP into the project's folder and list it in `images`.

Profile text and the top links (GitHub, LinkedIn, email, resume) are in [`src/data/profile.ts`](src/data/profile.ts). A link without an `href` is hidden.

### TODO

- [ ] **Resume.** Put the current PDF at `public/resume.pdf` and set `href: '/resume.pdf'` on the Resume link in `src/data/profile.ts`. It's hidden until then.
- [ ] Check the bio line in `src/data/profile.ts` is current.

## Social card and icons

`public/og.png` (1200×630) is rendered from `scripts/og.html`. `public/favicon.svg` is the icon; `favicon.ico` and `apple-touch-icon.png` are PNG renders of it. To regenerate after a change, open `scripts/og.html` in a browser at 1200×630 and screenshot it, or use any headless browser.

## Deploy

Pushing to `main` deploys to production through Vercel's Git integration. Every pull request gets a preview URL. GitHub Actions (`.github/workflows/ci.yml`) builds the site and runs `npm run check:links` on every push and PR.

Manual deploy, if ever needed:

```sh
npx vercel login       # once
npx vercel --prod
```

The Vercel project is `portfolio`. `vercel.json` sets the build, caching for hashed assets, and the redirects below.

The canonical origin (sitemap, canonical links, OG image URL) is `SITE` in `astro.config.mjs`. It can also be set with the `SITE_URL` environment variable.

## Moving veermickey.com to this site

veermickey.com currently points at GitHub Pages, which also serves three project sites at `veermickey.com/<repo>/`. `vercel.json` already redirects those paths to `https://veermshah.github.io/<repo>/`, so old links keep working after the move:

- `/dishbrain-playground/*`
- `/wetware-emulator/*`
- `/jev-calibration-lab/*`

Checklist, only when switching:

1. Add `veermickey.com` (and `www.veermickey.com`) to the Vercel project: `npx vercel domains add veermickey.com`, or Project Settings > Domains.
2. Update DNS at the registrar to the records Vercel shows (an `A` record for the apex, a `CNAME` for `www`). Wait for Vercel to show the domain as valid.
3. Remove the custom domain from the `veermshah.github.io` repo's Pages settings (Settings > Pages > Custom domain), so the project Pages sites serve from `veermshah.github.io` again and the redirects above land on real pages.
4. Set `SITE` in `astro.config.mjs` to `https://veermickey.com`, update `SITE` default in `scripts/check-links.mjs`, and redeploy.
5. Update the DishBrain, Wetware and Jev entries in `src/data/projects.ts` and their repo homepages if any still use `veermickey.com/<repo>`.
6. Check: `curl -sIL https://veermickey.com/dishbrain-playground/` ends in a 200 on `veermshah.github.io`.
