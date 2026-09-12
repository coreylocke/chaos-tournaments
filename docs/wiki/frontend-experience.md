# Frontend Experience

Full detail in Master Build Brief [Section 60](../MASTER_BUILD_BRIEF.md#60-addendum-2026-08-05-frontend-experience-direction).

## Layout model

The **homepage** (`/`) is a single scrolling narrative page. Everything else (registration,
dashboards, brackets, checkout) lives on dedicated routes per Section 53 of the brief.
Homepage CTAs redirect out to those routes rather than embedding forms inline — e.g. "Login
with Discord" goes to `/login`, "Browse Tournaments" goes to `/tournaments`.

## Hero: Three.js particle field

- Lives in `src/components/ParticleField.tsx`, mounted client-only via `next/dynamic`
  (`ssr: false`) so it never blocks first paint or causes hydration mismatches.
- Respects `prefers-reduced-motion`: falls back to a static gradient when the user has
  reduced-motion enabled, or on low-end/mobile devices (particle count scales down below a
  viewport-width threshold).
- Kept as a self-contained component so it can be swapped or upgraded independently of the
  rest of the page.

## Scroll-triggered animation

- GSAP + ScrollTrigger drives section reveals (fade/slide-up on enter), staggered card
  entrances in the feature grid, and a subtle parallax offset on the particle field as the
  hero scrolls out.
- Animation setup lives in `src/lib/scrollAnimations.ts`, called from a client component
  wrapper so server components stay server-rendered.

## Mobile-first requirements (unchanged from Section 54)

Large touch targets (48px minimum, see `.touch-target` in `globals.css`), sticky mobile CTA
bar, fast load on low-end devices — the particle field and scroll animation must degrade
gracefully rather than being disabled outright on mobile; see `frontend-experience.md`
above for the reduced-motion/low-end fallback.

## Design reference

- **chaostournaments.com** (existing live site): minimal, functional, same brand. Useful for
  seeing what's already shipped — see the [open question](./open-questions.md) about
  reconciling this build with it.
- **digitalbutlers.team**: oversized bold type, saturated background color with a
  high-contrast accent, floating 3D-rendered object overlapping the headline, pill CTAs,
  card-based portfolio sections with scroll reveals. Translated to Chaos Tournaments' gold/
  black palette rather than copied directly.
