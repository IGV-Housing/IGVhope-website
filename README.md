# IGV Hope — igvhope.com

Static site (self-contained HTML) served by Cloudflare, migrated off a
per-page Webflow-style export. No build step, no bundler — files are
served as authored.

---

## Repository layout

```
igvhope/
├── public/                     ← web root
│   ├── index.html               (homepage)
│   ├── _headers
│   ├── robots.txt               (explicitly allows search + AI crawlers)
│   ├── sitemap.xml
│   ├── about/index.html
│   ├── impact/index.html        (footer-only, not in top nav)
│   ├── faq/index.html
│   ├── how-it-works/index.html
│   ├── next-steps/index.html
│   ├── municipality/index.html
│   ├── terms/index.html
│   ├── try-again/index.html
│   ├── login/
│   │   ├── index.html
│   │   └── choose/index.html
│   ├── resources/
│   │   ├── index.html
│   │   └── <article-slug>/index.html   (8 articles)
│   ├── course-library/
│   │   ├── index.html
│   │   ├── starting-course/(index.html, Lessons/index.html)
│   │   └── course-1 … course-5/(index.html, Lessons/index.html)
│   └── assets/
│       ├── img/                 (deduped across all pages)
│       └── files/                (brochure + floorplan PDFs)
├── wrangler.jsonc
└── README.md
```

All asset references are root-absolute (`/assets/img/...`), never
relative. Internal nav links that pointed at the absolute production
domain (`https://www.igvhope.com/...`) have been rewritten root-relative,
matching how the other IGV property repos are set up.

---

## What changed from the raw export

The raw pre-Git export had one folder per page, each with its own
`images/` copy (Webflow's default per-page export shape), plus a handful
of things that didn't belong in a public marketing-site repo. This pass:

- Moved every page into `public/<slug>/index.html` (homepage → `public/index.html`).
- Deduped images by content hash into `public/assets/img/` — pages that
  shared the same logo/headshot/favicon now point at one file instead of
  N copies. Where two different files happened to share a name, the
  losing one was renamed with its source page as a prefix.
- Fixed a live bug in `course-4`'s lesson links, which pointed at
  `/Course 4/Lessons/` (wrong, absolute, capitalized, space in the path)
  instead of `/course-library/course-4/Lessons/`.
- Fixed a pre-existing bug in `about/index.html`'s favicon `<link>`,
  which was `/about/images/favicon.ico` (a page-relative path written as
  if it were root-absolute — a common artifact of per-page Webflow
  exports where each page believed it was the site root).
- Updated `login/choose/index.html`'s two destination cards, which
  pointed at raw `*.workers.dev` / `*.pages.dev` deployment URLs for
  course-library and resources, to `/course-library` and `/resources`
  now that both live in this repo.
- **Excluded** `igv platform - management` and `igv platform - supply`
  from this repo entirely. Both were full internal dashboards (Airtable-
  backed property/compliance/financials data) built for
  `management.igvhousing.com` / `supply.igvhousing.com` — a different
  domain — not igvhope.com marketing content. One of them had a live
  Airtable personal access token hardcoded in client-side JS; **that
  token must be revoked/rotated in Airtable if it hasn't been already**,
  independent of this repo. `login/index.html`'s post-unlock dashboard
  still links out to `supply.igvhousing.com`, `demand.igvhousing.com`
  and `management.igvhousing.com` as external destinations, which is
  unaffected by this exclusion.

---

## Crawling / AI indexing

`public/robots.txt` allows all crawlers, with explicit entries for the
known AI crawlers (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot,
Claude-Web, anthropic-ai, Google-Extended, PerplexityBot, CCBot, Bingbot)
so the site can be crawled and cited by AI search/assistants as well as
traditional search engines. `public/sitemap.xml` lists the site's
indexable pages (marketing pages, resources articles, course-library).
`login`, `login/choose` and `try-again` are deliberately left out of the
sitemap — they're not content pages, and the sitemap should only include
pages worth being discovered. If the goal ever flips to blocking AI
training crawlers while keeping normal search indexing, that's a
`Disallow:` per AI bot in the same file, not a site-wide change.

---

## Known follow-ups

- `login/index.html` is a client-side-only "unlock" gate (password input,
  no real auth) that reveals links to the three platform subdomains
  above. It is not a real login system — treat it as a marketing
  placeholder, not an access control.
- `login/choose/index.html` isn't linked from anywhere else in the site
  (same for `try-again/index.html`). Both were kept since they exist in
  production, but confirm whether they're still reachable via some flow
  before assuming they're dead.
- CSS and JS are still inline in each page, duplicated across all of
  them (nav, footer, design tokens). Extracting to shared files is a
  bigger job than this pass; do it separately.
- The Mapbox token embedded in three pages (`pk.eyJ1...`) is a public
  token, safe for client-side use, but GitHub's push protection still
  flags it — allow-listing it per-repo is expected and not a leak.
- No Cloudflare Worker is committed here — nothing in this site currently
  needs one (its lead-capture forms are either a client-side multi-step
  flow or HubSpot embeds, not a custom form + reCAPTCHA + API pattern
  like `igvcapital-contact-verify`).
- The `igvhope-website` Workers project is Git-connected (as of 2026-09-04)
  for auto-deploy on push to `main`. Before that, every change needed a
  manual `npx wrangler deploy` — if a push ever doesn't show up live,
  check the Deployments tab to confirm the Git connection is still
  intact rather than assuming the code is wrong.
