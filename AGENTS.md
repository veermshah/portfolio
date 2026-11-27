# Agent guide

Personal site for Veer Shah: www.veermickey.com (Astro, Vercel) and blog.veermickey.com (Supabase). See `README.md` for how to run, edit and deploy.

## Before you change anything

- **Read past agent sessions with Entire.** Work on this repo is recorded as Entire checkpoints. If the CLI is missing, install it (`curl -fsSL https://entire.com/install.sh | bash`) and run `entire enable` in this clone. Then check what earlier agents did and why:
  - `entire search "<topic>" --compact` to find related sessions
  - `entire checkpoint explain <id>` for details, or `entire why <file>:<line>` for the reason behind a line
  - `entire agent-help` for the exact flags (don't guess them)
- **Never upload checkpoints to this public repo.** They hold full transcripts. Checkpoints go only to the private repo `veermshah/portfolio-checkpoints`. Run `entire status` before enabling uploads (see README, "Agent sessions").
- **Check real engagement before redesigning.** Run `npm run analytics -- 30` (needs `SUPABASE_ACCESS_TOKEN`) to see which pages, sections and clicks people use. Tracking data is private: never show it on the public site.

## Rules

- Desktop and mobile must offer the same features. Don't build hover-only interactions.
- Don't invent stats, testimonials, partners, placeholder copy or contact details.
- Keep canonical URLs on `https://www.veermickey.com`.
- Run `npm run build` and `npm run check:links` before opening a PR.
- **Agent visits must never count in the analytics.** Open the site with `?notrack=1` on the first page you load in any browser (for example `https://www.veermickey.com/?notrack=1`), which opts that browser out for a year on the main site and the blog. Automated browsers (`navigator.webdriver`, headless, Lighthouse, PageSpeed, crawlers) are skipped by `src/scripts/notrack.ts`; keep that check in place and don't add any other tracker that ignores it.
