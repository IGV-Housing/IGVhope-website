# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static site for igvhope.com (self-contained HTML, no build step, no bundler, no package.json). Every page is a single `.html` file with inline `<style>` and `<script>` — CSS/JS are not extracted into shared files, so a change to nav, footer, or design tokens has to be applied to every page individually (there is no single source of truth to edit once).

## Commands

There is no build, lint, or test tooling — this is raw HTML/CSS/JS served as-is.

- **Deploy**: `npx wrangler deploy` (from repo root). Wrangler reads `wrangler.jsonc`, which points `assets.directory` at `./public`.
- **Normal path**: the `igvhope-website` Cloudflare Workers project is Git-connected for auto-deploy on push to `main` — a plain `git push` is usually enough. Only fall back to a manual `wrangler deploy` if a push doesn't show up live (check the Cloudflare dashboard's Deployments tab first to confirm the Git connection is still intact before assuming the code is wrong).
- **Local preview**: no dev server is configured in this repo; there's no `wrangler dev` setup beyond what the default `wrangler.jsonc` provides.

## Architecture

### Two nav templates, not one

Pages use one of two independently-maintained header/nav implementations — check which one a page uses before copying nav markup from another page:

- **`<nav id="dash-nav">`**: homepage (`public/index.html`), `terms`, `municipality`, `try-again`, `login/choose`, and everything under `course-library/`. Uses `.nav-right`, `.nav-signup-btn`, `.mobile-nav-link` classes.
- **`<nav class="site-nav">`**: `about`, `faq`, `how-it-works`, `next-steps`, `impact`, and everything under `resources/`. Uses `.nav-links`, `.nav-cta`, and (mostly) bare `<a href="...">` mobile links with no class.
- `login/index.html` has neither — it's a standalone client-side "unlock" gate with its own minimal nav, not a real login system.

Both templates independently duplicate the footer (`<footer id="dash-footer">` with `.sitemap-col` columns) on every single page — same story: no shared partial, so a footer link/order/copy change means editing all ~30 pages. When doing that, watch for two easy mistakes seen before in this repo: (1) some pages' mobile nav panel uses bare `<a href="/x">` links identical in shape to the footer's bare links — a blind find-and-replace across a whole file can hit both and double up content meant for only one; (2) some pages have their own local variation on link order or wording (e.g. `municipality`'s footer lists Resources before About, `resources/index.html`'s own footer link carries `class="current"`) — verify each file's actual match rather than assuming they're byte-identical.

### Third-party integrations (client-side only, no server code in this repo)

- **HubSpot** (portal `342997618`, na3 instance): the `hs-script-loader` tracking snippet sits in `<head>` on most pages. Lead-capture forms POST directly to `api-na3.hsforms.com` from inline JS (see `submitToHubspot()` in `next-steps/index.html` for the fullest example) — there is no server-side form handler or Cloudflare Worker in this repo.
- **Magic-link session auth**: nav login state (avatar/dropdown vs "Log in" link) is checked client-side against `https://magic-link.igvhousing.workers.dev/session` — that Worker lives in a different repo, not this one.
- **Google Analytics (GA4)**: `gtag.js`, measurement ID `G-T84CV7T1WS`, inserted right after `<meta charset="UTF-8">` on every page.
- **Mapbox**: the `pk.eyJ1...` token embedded in a few pages is a public token (safe client-side) — GitHub push protection flags it anyway; that's expected, not a real leak.
- **ElevenLabs**: the `<elevenlabs-convai>` voice widget appears near the end of `<body>` on most pages.

### robots.txt / sitemap.xml

`public/robots.txt` explicitly allows both search engines and named AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot, etc.) — Cloudflare's "AI Crawl Control" feature has previously injected its own conflicting `Disallow` block ahead of this file's rules at the edge; if AI/search visibility ever regresses, check that Cloudflare setting before assuming this file is wrong. `public/sitemap.xml` only lists real content pages — `login`, `login/choose`, and `try-again` are deliberately excluded.

### What's deliberately not in this repo

`igv platform - management` and `igv platform - supply` (Airtable-backed internal dashboards for `management.igvhousing.com` / `supply.igvhousing.com`, a different domain) were excluded during the original import and must not be re-added here — see the "What changed from the raw export" section of `README.md` for why, including a live credential that was found and stripped.

### Course library structure

`course-library/` has a `starting-course` plus `course-1` through `course-5`, each with its own `index.html` (overview) and `Lessons/index.html` (a single page that renders different lesson content client-side based on a `?lesson=N` query string — there's no per-lesson route).

**Known content bug, not yet fixed**: `course-4/Lessons/index.html` and `course-5/index.html` are byte-identical duplicates of the "Course 4 - Overview" content — this is a pre-existing authoring mistake (confirmed by diffing against the original pre-Git export, not something introduced during the migration into this repo) and predates this repo. Only `course-5/Lessons/index.html` has real, distinct content. Don't treat either file's current content as correct if asked to work on it.
