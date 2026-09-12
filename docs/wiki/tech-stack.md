# Tech Stack

Full detail in Master Build Brief [Section 1](../MASTER_BUILD_BRIEF.md#1-core-technology-stack).
This page tracks the current, as-built state.

## Frontend

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS — gold/black theme in `tailwind.config.ts`
- Three.js — hero particle field (client-only)
- GSAP + ScrollTrigger — scroll-triggered section reveals
- next/image, next/font, App Router metadata API for favicons/OG/manifest

## Backend / Data

- Supabase (Postgres, Auth, Storage, Row Level Security, Edge Functions)
- Discord OAuth via Supabase Auth
- Stripe (Phase 3, not wired yet)

## Automation / Content

- n8n — workflow automation (notifications, reminders, Sheets sync)
- Firecrawl — web data / crawling for content enrichment (see [integrations](./integrations.md))
- Higgsfield — AI video/image generation for hype content (see [integrations](./integrations.md))
- Google Sheets — reporting mirror only, never source of truth
- Discord webhook notifications — live (see [integrations](./integrations.md)); not a
  full bot yet (no roles, slash commands, or check-in reminders — that's a separate,
  larger project needing its own bot process)

## Infra

- Docker (multi-stage build, Next.js `output: "standalone"`)
- Caddy 2 reverse proxy (automatic HTTPS) — reused from the VPS's existing setup, not
  Nginx/Certbot as originally planned (see [deployment](./deployment.md))
- Deployed on Corey's existing VPS (see [deployment](./deployment.md))

## Why these choices

- **Three.js over a CSS-only particle effect**: brief asks for an actual 3D element, not just
  a background gradient; Three.js gives real depth/parallax and is the standard choice for
  this.
- **GSAP ScrollTrigger over pure CSS scroll-snap**: needed for staggered, choreographed
  reveals across a long one-page layout, not just section snapping.
- **Firecrawl self-host is optional, not required**: start on the hosted API (faster to wire
  into n8n); self-host later if crawl volume or cost justifies running the Docker stack on
  the VPS.
