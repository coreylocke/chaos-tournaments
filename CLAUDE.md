---

## title: Chaos \- Claude Deliverables type: spec last-updated: 2026-08-01 tags: \[chaos-tournaments, architecture, pre-build, spec\]

# Chaos \- Claude Deliverables

**Summary**: The 25-item pre-Phase-1 spec required by the master build brief (Section 57, originally "Hermes Deliverables" — see Chaos \- Build Plan and Business Rules for why it's renamed), plus the Section 25a/25b/25c/25d/25e/25f Phase 2, 3, 4, 5, 6, and 7 milestones added as each prior phase shipped. This is the architecture, schema, flows, and implementation milestones that guide each build phase. This is the standalone copy — drop it into the site repo as `docs/CLAUDE.md` so Claude Code has full context without needing the wiki vault.

**Sources**: Synthesized from every Chaos Tournaments detail page in this wiki, all of which trace back to `raw/Chaos MASTER BUILD BRIEF.md`, plus decisions made directly with Corey on 2026-07-29 (game identity, tenancy, platform rules), 2026-07-31 (Phase 2 planning: team invitations, Phase 2/4 registration split, coach/manager roster caps), 2026-07-31 (Phase 3 planning: payment_review status, captain-only entry funding for this pass, payout_entitlements deferred to Phase 7), 2026-07-31 (Phase 4 planning: tournament_rules, no separate check_ins table, check-in gating, registration-approval scope), 2026-08-01 (Phase 5 planning: matches advancement-uniqueness resolution, admin-only result entry, match_evidence/disputes deferred, registration_order-only seeding), 2026-08-01 (Phase 6 planning: two-party result confirmation, team_statistics scoped to per-match fields, dispute-resolution branches without dedicated result_type/bracket-repair tooling, lazy auto-confirmation), and 2026-08-01 (Phase 7 planning: payout_entitlements activated as the authoritative record, 1st/2nd place only, 'placement' allocation method only, automatic payout generation at tournament completion).

**Last updated**: 2026-08-01

---

## 0\. Decisions this spec assumes (read first)

These aren't in the original brief — they were decided in conversation and this entire document builds on them:

- **Game**: Rainbow Six Siege. 5-starter roster default, Siege terminology throughout.  
- **Tenancy**: single-tenant (Chaos Tournaments only) for this build. No org/customer table, no per-tenant scoping anywhere below. A future multi-tenant port is a known, planned, *separate* project — not designed for here.  
- **Platform rules**: two different rule sets depending on context.  
  - **Tournament play**: PC is isolated (PC only ever plays PC). PS5, Xbox, and PS4 all cross-play together as one "Console" division.  
  - **Grudge matches**: no platform restriction at all. Any platform can challenge any platform or team, PC included.  
- **Stripe Connect**: built for, but not activated. Every payment flow below assumes a single connected Stripe account (Chaos's own), not per-user Connect accounts.

**Phase 2 planning decisions (2026-07-31)** — the master build brief names `team_invitations` and the Phase 2/Phase 4 registration split without fully specifying either; these fill the gaps:

- **Team invitations require an existing account.** `team_invitations.invited_user_id` is a non-null FK to `users` — you can only invite someone who has already logged in with Discord at least once. This doesn't weaken the payout-entitlement rule (entitlement only ever attaches to whoever pays, which already requires being logged in); it's purely to avoid the added complexity of linking a pending invite to an account that doesn't exist yet. Revisit if unregistered-user invites turn out to matter in practice.
- **Phase 2 includes a *minimal* tournament-registration trigger, not the full Phase 4 flow.** The brief's Phase 2 description lists "registration entry slots," which can't exist without a `tournament_registrations` row — so Phase 2 adds a bare "register this team for this tournament" action (validates division/platform/starter-count, creates the registration, snapshots the roster into `registration_rosters`, generates `registration_entry_slots`). The polished experience — dedicated `/tournaments/[slug]` pages, rules acceptance, check-in, the full registration stepper, success-screen buttons — stays Phase 4 work per the brief's own split.
- **`maximum_coaches`/`maximum_managers` added to `tournaments`.** The brief's Section 19 calls for both; the original schema pass here omitted them. Added as `int not null default 1` each, enforced by the same roster-validation logic that checks `maximum_substitutes`/`maximum_reserves`.

**Phase 3 planning decisions (2026-07-31)**:

- **`tournament_registrations.status` was missing `'payment_review'`.** Section 13's webhook flow explicitly targets that status on verification failure, but the CHECK constraint from the original schema pass never included it. Added via migration.
- **Entry funding is captain-only for this pass, not the full sponsor-link model.** The brief describes a standalone `/pay/[entry-link]` flow letting any authorized third party (not just team members) fund an entry via a shareable link — but that requires a link/token mechanism nowhere specified in the schema. This pass lets the team captain pay for any of their team's unpaid entries (covering "pay for self" and "pay for teammates" from Section 20's wireframe) using the same RLS-visibility the captain already has from Phase 2. The standalone sponsor-link flow for non-team-members is deferred to a later pass.
- **`payout_entitlements` (the separate table) is not created yet.** The Stripe webhook sets `registration_entry_slots.payout_entitlement_user_id`/`entitlement_status` directly, matching Section 13's literal webhook-flow wording. The dedicated `payout_entitlements` table (needed for `entitlement_transfers` and formal payout calculation) is deferred to Phase 7 ("Prize Allocation and Payouts"), where it's actually exercised.

**Phase 4 planning decisions (2026-07-31)** — the master build brief names `tournament_rules` and `check_ins` without fully specifying either:

- **`tournament_rules` is one admin-editable rules body per tournament**, set via a textarea on the admin tournament-creation form (no separate rules-editing UI built yet — creating a tournament is currently the only way to set its rules). Versioned (`version int`) so a future edit can be told apart from what a team already accepted, even though nothing enforces re-acceptance on a version bump yet.
- **No separate `check_ins` table.** `tournament_registrations.checked_in_at`, already in the Phase 1 schema, is enough for Phase 4 — same reasoning as `payout_entitlements` in Phase 3: build the dedicated table only when something needs more than a timestamp.
- **Check-in is gated**, not just a free checkbox: it requires `funding_status = 'fully_funded'`, `rules_accepted_at` already set, and — if the tournament configures `check_in_open_at`/`check_in_close_at` — the current time inside that window. This matches the brief's own step order (Entry Funding → Rules → Check-In) and Section 51's "server-side eligibility checks" requirement.
- **Registration approval is scoped to just approve/reject.** Section 21's admin dashboard lists many more actions (lock/unlock roster, correct payer assignment, seed brackets, etc.) — only the one action Phase 4 explicitly calls for ("registration approval") was built; the rest belongs to the phases that actually need them.

**Phase 5 planning decisions (2026-08-01)**:

- **The `matches` table's flagged broken unique constraint is resolved by dropping it, not fixing it.** Section 3's original DDL noted the advancement-uniqueness constraint referenced a nonexistent `source_match_id` column (the schema actually splits source across `team_1_source_match_id`/`team_2_source_match_id`) and flagged it as needing a generated column or application-level check. Resolved with the latter: `finalizeMatch` uses an atomic `UPDATE ... WHERE status NOT IN ('completed','voided')`, so a match can only ever be finalized once — no DB constraint needed, matching Section 16's own "a completed match can only be reopened by an explicit admin action" rule.
- **Result entry is admin-only for Phase 5**, not the two-party captain-submits/opponent-confirms flow. The brief's Section 31 (captain submission → opponent confirmation/dispute → auto-confirmation) is explicitly Phase 6 ("Results & Disputes") work — Phase 5 is scoped to "match creation, readiness, score validation, automatic advancement," which only needs *a* result, not *how it was agreed on*. `match_results`/`match_confirmations` rows are still written (`confirmation_type = 'admin'`), so Phase 6 can build the player-facing flow on top of the same tables without a schema change.
- **`match_evidence` and `disputes` tables are not created yet** — nothing in Phase 5 raises a dispute or needs evidence upload (both explicitly Phase 6), so `matches.dispute_status` stays null and finalizeMatch's "no open dispute" check is trivially satisfied for now.
- **Seeding uses `registration_order` only.** `tournament_settings.seeding_method` supports six values, but `ranking_based`/`performance_based` need stats data that doesn't exist until later phases, and `manual` needs a dedicated admin drag-and-drop UI. `random`/`hybrid` were skipped too, to keep this pass to one clearly-correct, deterministic algorithm rather than several half-built ones. The standard bracket-seeding placement algorithm (recursive "seed vs. `n+1-seed`") is used regardless of ordering method, so top seeds are always separated across the bracket per Section 27.
- **Bracket eligibility requires the exact gate from the brief**: `tournament_registrations.status = 'approved'` (Phase 4's admin approval) AND `funding_status = 'fully_funded'` (Phase 3) AND `checked_in_at` set (Phase 4). This is the first place all three prior phases' gates compose together.

**Phase 6 planning decisions (2026-08-01)**:

- **Result entry is now the full two-party flow from Section 31**: a captain submits (tentative winner, series score, optional evidence screenshot), the opposing captain either confirms (finalizes) or disputes (blocks advancement pending admin review). Both paths share one `completeMatch` core with Phase 5's `finalizeMatch` (now the admin direct-entry path) and the new forfeit/dispute-resolution paths, so idempotency and team-statistics bookkeeping only exist in one place. `confirmResult` and `disputeResult` both reject the submitting team's own captain — confirming or disputing your own reported result isn't allowed; it has to be the opponent.
- **`team_statistics` is scoped to per-match fields only** (`matches_played/won/lost`, `forfeit_wins/losses`, current/longest win streak) for this pass. The master brief pairs tournament-placement stats (rankings, season points) with payout creation at tournament-completion time, not per-match — deferred to Phase 7, matching the "increment at the natural trigger point" pattern used throughout this build (e.g. `funding_status` recalculates at the payment webhook, not at registration).
- **Two dispute-resolution branches reuse `result_type = 'admin_score'`** (`result_reversed` and `team_disqualified`) because the schema's `result_type` enum has no dedicated value for either. **`double_forfeit` resolution via the disputes path doesn't support designating a winner** — only the direct admin forfeit action does — because the dispute-resolution form has no field for it in this pass. **`partial_replay` is treated identically to `match_replay`** (full reset to `ready`) since no per-map score tracking exists yet to make a partial replay meaningfully different. All three are scoped-down implementations of resolution types the brief names but which need bracket-repair tooling this phase doesn't build.
- **Auto-confirmation is lazy, not cron-driven.** `maybeAutoConfirm` runs on page load (the captain match page calls it before rendering) rather than on a schedule, because no background-job infrastructure exists yet — that's Phase 8/n8n territory. A match sits in `awaiting_confirmation` until either captain visits the page after the window closes, or an admin acts on it directly.
- **`disputes.match_id` has no `ON DELETE CASCADE`**, unlike its siblings `match_results`/`match_confirmations`/`match_evidence` — this was already how Section 3's DDL specified it before this phase, not a Phase 6 change, but it's worth calling out: a match with an open dispute record can't be deleted out from under it, which is a reasonable guardrail against silently losing dispute history.

**Phase 7 planning decisions (2026-08-01)**:

- **`payout_entitlements` is now the authoritative entitlement record**, activated per its own Phase 3 deferral note. `registration_entry_slots.payout_entitlement_user_id`/`entitlement_status` become a denormalized read cache going forward — the Stripe webhook (`paymentService.handleCheckoutSessionCompleted`) now writes both in the same pass, same treatment as `payment_id`/`payment_entry_allocations`. Two constraints the original DDL didn't encode were added: `payout_entitlements.entry_slot_id` is now `unique` (the ER diagram already implied a one-to-zero-or-one relationship to `registration_entry_slots`) and `payouts` gained `unique (prize_allocation_id, recipient_user_id)`, the exact constraint Section 17's own pseudocode calls for ("prevent duplicate payout generation per tournament") but the original schema pass never added — same class of gap as the Phase 5 matches-table fix.
- **Only 1st and 2nd place are computed.** Single elimination directly determines a champion (final match winner) and runner-up (final match loser) — brief Section 32/34's own pseudocode names exactly these two. Nothing in this build determines a 3rd-place team (no 3rd-place decider match exists, and splitting between both semifinal losers is never specified), so `third_place_prize_cents`, if an admin configures it, is simply not distributed. Revisit if a 3rd-place decider match is ever built.
- **Only `prize_allocation_method = 'placement'` is supported** — every tournament in this build configures a direct dollar amount per placement (`first_place_prize_cents`/`second_place_prize_cents`), not a percentage-of-pool split, so that's the only method implemented. `operations_fee_percentage` and percentage-based allocation stay unused until a percentage-split method is actually built.
- **Payout generation is automatic**, triggered inside `matchAdvancementService.advanceWinner` the instant the championship match completes (no `next_match_id`) — the same "increment at the natural trigger point" pattern used throughout this build, and a direct match for brief Section 34's "when the championship match completes... create payout records... place payouts into administrative review." `brackets.status` also moves to `'completed'` at this same point, closing a small gap left over from Phase 5 (bracket status previously stayed `'active'` forever).
- **The payout status workflow uses the Section 3 DDL's existing enum** (`pending_review → approved → processing → paid`, plus `failed`/`cancelled`), not the brief's six-stage `results_verified/entitlements_verified/recipient_verified/payout_approved/payout_processing/payout_sent` naming (Section 34) — the DDL enum was already the agreed schema before this phase and captures the same "never automatic, always admin-gated" requirement with fewer states. This pass implements `pending_review → approved → paid` (admin approve, then mark-paid); `processing`/`failed`/`cancelled` stay valid-but-unused enum values since there's no bank-transfer integration to drive them yet.
- **`team_statistics` gains `tournaments_entered`/`tournaments_won`/`runner_up_finishes`** — the exact fields Phase 6 named as deferred to Phase 7. `tournaments_entered` increments for every team that reached the bracket (same eligibility gate as bracket generation); `tournaments_won`/`runner_up_finishes` increment for the champion/runner-up only. `semifinal_finishes`/`quarterfinal_finishes`/`ranking_points`/`series_won`/`series_lost`/`maps_won`/`maps_lost` (brief Section 38) stay deferred: the round-based finishes need per-round elimination classification unrelated to payout math, `ranking_points` needs the season/points system that's explicitly Phase 9 work, and per-map stats need scoring data that doesn't exist (same gap Phase 6 already noted).
- **Admin payout review is scoped to approve + mark-paid** on a new `/admin/payouts` page — `processing`/`failed`/`cancelled` transitions and downloadable receipts are deferred, no payment-rails integration exists to drive them, consistent with every prior "no PDF/download infra" deferral in this build. No payer-facing "my payouts" dashboard yet either — Section 22's sponsor dashboard was already deferred at Phase 3 and stays deferred here.
- **`entitlement_transfers` is created but has no transfer UI or action.** Phase 7's own brief description doesn't call for entitlement transfers, and brief Section 15 explicitly says the initial production version may disable transfers entirely.

---

## 1\. Recommended system architecture

Layered, single Next.js app, Supabase as the only authoritative datastore:

┌─────────────────────────────────────────────┐

│  Next.js (React, TypeScript, Tailwind)       │

│  \- Pages/routes (App Router)                 │

│  \- Client components (forms, dashboards)     │

└───────────────┬───────────────────────────────┘

                │  typed calls only — no raw SQL from client

┌───────────────▼───────────────────────────────┐

│  Service layer (server-side, in Next.js       │

│  API routes / Server Actions)                 │

│  \- entrySlotService, paymentService,          │

│    payoutService, bracketService,             │

│    matchAdvancementService, refundService     │

└───────────────┬───────────────────────────────┘

                │  typed Supabase client (service role for

                │  privileged ops, anon+RLS for user-scoped ops)

┌───────────────▼───────────────────────────────┐

│  Supabase (Postgres \+ Auth \+ Storage \+ Edge   │

│  Functions) — sole source of truth            │

└───────────────┬───────────────────────────────┘

                │  DB webhooks / triggers

┌───────────────▼───────────────────────────────┐

│  n8n — downstream automation only             │

│  (Discord notifications, Sheets sync, emails) │

└─────────────────────────────────────────────────┘

Stripe ⇄ Next.js API route (webhook receiver, verifies signature,

         calls paymentService inside a DB transaction)

Discord ⇄ Supabase Auth (OAuth) \+ a separate bot process (roles,

          slash commands) that only reads/writes via the service layer

Non-negotiables baked into this shape (see Chaos-Tournaments-Project-Overview): Supabase is the only source of truth; a Stripe webhook (never a browser redirect) marks an entry paid; the server always calculates money and eligibility; PC/console tournament isolation is enforced server-side; only starting-player slots cost money.

---

## 2\. Database entity-relationship model

erDiagram

    users ||--o{ team\_members : "is"

    users ||--o{ discord\_accounts : "has"

    teams ||--o{ team\_members : "has"

    teams ||--o{ tournament\_registrations : "registers"

    tournaments ||--o{ tournament\_registrations : "receives"

    tournaments ||--|| tournament\_settings : "configures"

    tournament\_registrations ||--o{ registration\_entry\_slots : "creates"

    registration\_entry\_slots ||--o{ payment\_entry\_allocations : "funded by"

    payments ||--o{ payment\_entry\_allocations : "allocates"

    registration\_entry\_slots ||--o| payout\_entitlements : "grants"

    payout\_entitlements ||--o{ prize\_allocations : "receives"

    prize\_allocations ||--o{ payout\_line\_items : "itemizes"

    payments ||--o{ refunds : "may reverse"

    payments ||--o{ chargebacks : "may dispute"

    tournaments ||--o{ brackets : "generates"

    brackets ||--o{ bracket\_slots : "seeds"

    brackets ||--o{ matches : "contains"

    matches ||--o{ match\_results : "records"

    matches ||--o{ match\_confirmations : "confirms"

    matches ||--o{ disputes : "may raise"

    matches ||--o{ match\_evidence : "has"

    teams ||--|| team\_statistics : "tracks"

    teams ||--o{ grudge\_matches : "challenges"

    grudge\_matches ||--o{ grudge\_match\_participants : "involves"

    teams ||--o{ substitutions : "logs"

Full field lists for the highest-detail tables are on Chaos \- Database Schema, Chaos \- Entry Slots and Checkout, Chaos \- Payment and Payout Model.

---

## 3\. Proposed Supabase SQL schema

Scoped to the tables that carry real architectural risk (money, entitlements, brackets, identity). Supporting/stats tables are listed at the end without full DDL — same conventions apply, but the brief explicitly says not to build everything in one uncontrolled pass, so their exact columns get finalized when their phase starts.

Conventions: `uuid` primary keys (`gen_random_uuid()`), `timestamptz` for all timestamps, integer cents for all money, `created_at`/`updated_at` on every table, status fields constrained with `CHECK`, foreign keys `ON DELETE RESTRICT` unless noted.

\-- Identity \------------------------------------------------------------

create table users (

  user\_id uuid primary key default gen\_random\_uuid(),

  supabase\_auth\_id uuid unique not null,

  email text,

  preferred\_platform text check (preferred\_platform in ('PC','PS5','Xbox','PS4')),

  account\_status text not null default 'active' check (account\_status in ('active','suspended','deleted')),

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now()

);

create table discord\_accounts (

  discord\_account\_id uuid primary key default gen\_random\_uuid(),

  user\_id uuid not null references users(user\_id) on delete cascade,

  discord\_user\_id text unique not null,

  discord\_username text not null,

  discord\_display\_name text,

  discord\_avatar\_url text,

  linked\_at timestamptz not null default now()

);

\-- Teams \-----------------------------------------------------------------

create table teams (

  team\_id uuid primary key default gen\_random\_uuid(),

  team\_name text not null,

  team\_slug text unique not null,

  team\_logo\_url text,

  captain\_user\_id uuid not null references users(user\_id),

  division text not null check (division in ('PC','Console')),

  status text not null default 'active' check (status in ('active','disbanded','suspended')),

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now()

);

create table team\_members (

  team\_member\_id uuid primary key default gen\_random\_uuid(),

  team\_id uuid not null references teams(team\_id) on delete cascade,

  user\_id uuid not null references users(user\_id),

  roster\_role text not null check (roster\_role in ('starter','substitute','reserve','coach','manager')),

  platform text not null check (platform in ('PC','PS5','Xbox','PS4')),

  game\_username text,

  is\_confirmed boolean not null default false,

  is\_active boolean not null default true,

  joined\_at timestamptz not null default now(),

  removed\_at timestamptz,

  unique (team\_id, user\_id)

);

create table team\_invitations (

  invitation\_id uuid primary key default gen\_random\_uuid(),

  team\_id uuid not null references teams(team\_id) on delete cascade,

  invited\_user\_id uuid not null references users(user\_id),

  invited\_by\_user\_id uuid not null references users(user\_id),

  roster\_role text not null check (roster\_role in ('starter','substitute','reserve','coach','manager')),

  platform text not null check (platform in ('PC','PS5','Xbox','PS4')),

  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked','expired')),

  created\_at timestamptz not null default now(),

  responded\_at timestamptz

);

\-- Tournaments \-------------------------------------------------------------

create table tournaments (

  tournament\_id uuid primary key default gen\_random\_uuid(),

  name text not null,

  slug text unique not null,

  division text not null check (division in ('PC','Console')),

  required\_starting\_players int not null default 5,

  maximum\_substitutes int not null default 2,

  maximum\_reserves int not null default 2,

  maximum\_coaches int not null default 1,

  maximum\_managers int not null default 1,

  minimum\_teams int not null default 4,

  maximum\_teams int,

  bracket\_size int,

  best\_of int not null default 1 check (best\_of in (1,3,5)),

  entry\_fee\_per\_starting\_slot\_cents int not null,

  prize\_allocation\_method text not null default 'placement',

  first\_place\_prize\_cents int,

  second\_place\_prize\_cents int,

  third\_place\_prize\_cents int,

  registration\_open\_at timestamptz,

  registration\_close\_at timestamptz,

  payment\_deadline timestamptz,

  check\_in\_open\_at timestamptz,

  check\_in\_close\_at timestamptz,

  roster\_lock\_at timestamptz,

  entitlement\_lock\_at timestamptz,

  starts\_at timestamptz,

  status text not null default 'draft' check (status in ('draft','open','registration\_closed','in\_progress','completed','cancelled')),

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now()

);

create table tournament\_settings (

  tournament\_id uuid primary key references tournaments(tournament\_id) on delete cascade,

  operations\_fee\_percentage numeric(5,2) not null default 20.00,

  prize\_rounding\_increment\_cents int not null default 500,

  remainder\_allocation\_rule text not null default 'captain\_funded\_entry',

  remainder\_fallback\_rule text not null default 'earliest\_funded\_payer',

  double\_no\_show\_policy text not null default 'void\_match'

    check (double\_no\_show\_policy in ('advance\_neither','advance\_designated\_team','award\_bye\_to\_next\_opponent','reschedule\_match','void\_match')),

  auto\_confirmation\_enabled boolean not null default true,

  auto\_confirmation\_window\_minutes int not null default 60,

  auto\_confirmation\_value\_threshold\_cents int,

  allow\_payer\_to\_sponsor\_opposing\_teams boolean not null default false,

  seeding\_method text not null default 'hybrid'

    check (seeding\_method in ('random','registration\_order','manual','ranking\_based','performance\_based','hybrid'))

);

create table tournament\_rules (

  tournament\_rules\_id uuid primary key default gen\_random\_uuid(),

  tournament\_id uuid not null references tournaments(tournament\_id) on delete cascade,

  body text not null,

  version int not null default 1,

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now(),

  unique (tournament\_id)

);

\-- Registration & entry slots \---------------------------------------------

create table tournament\_registrations (

  registration\_id uuid primary key default gen\_random\_uuid(),

  tournament\_id uuid not null references tournaments(tournament\_id),

  team\_id uuid not null references teams(team\_id),

  funding\_status text not null default 'unfunded'

    check (funding\_status in ('unfunded','partially\_funded','fully\_funded','payment\_mismatch','refund\_pending','partially\_refunded','refunded','chargeback\_review','admin\_review')),

  rules\_accepted\_at timestamptz,

  checked\_in\_at timestamptz,

  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn','payment\_review')),

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now(),

  unique (tournament\_id, team\_id)

);

create table registration\_rosters (

  registration\_roster\_id uuid primary key default gen\_random\_uuid(),

  registration\_id uuid not null references tournament\_registrations(registration\_id) on delete cascade,

  team\_member\_id uuid not null references team\_members(team\_member\_id),

  assigned\_role text not null check (assigned\_role in ('starter','substitute','reserve','coach','manager')),

  starter\_slot\_number int,

  eligibility\_status text not null default 'eligible' check (eligibility\_status in ('eligible','ineligible','pending\_review')),

  confirmation\_status text not null default 'pending' check (confirmation\_status in ('pending','confirmed','declined')),

  locked\_at timestamptz,

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now(),

  unique (registration\_id, team\_member\_id)

);

\-- Roster role and entry-payment ownership stay separate: registration\_rosters

\-- records who plays what role for this specific registration; payer/entitlement

\-- ownership lives entirely on registration\_entry\_slots and payout\_entitlements.

create table registration\_entry\_slots (

  entry\_slot\_id uuid primary key default gen\_random\_uuid(),

  registration\_id uuid not null references tournament\_registrations(registration\_id) on delete cascade,

  slot\_number int not null,

  assigned\_starter\_user\_id uuid references users(user\_id),

  entry\_fee\_amount\_cents int not null,

  currency text not null default 'usd',

  payment\_status text not null default 'unpaid'

    check (payment\_status in ('unpaid','checkout\_pending','paid','payment\_failed','refunded','partially\_refunded','chargeback\_pending','charged\_back','waived','admin\_review')),

  checkout\_lock\_status text not null default 'available'

    check (checkout\_lock\_status in ('available','locked\_for\_checkout','paid','expired','released')),

  checkout\_lock\_expires\_at timestamptz,

  payer\_user\_id uuid references users(user\_id),

  payment\_id uuid, \-- denormalized cache; payment\_entry\_allocations is authoritative

  payout\_entitlement\_user\_id uuid references users(user\_id),

  entitlement\_status text not null default 'pending'

    check (entitlement\_status in ('pending','active','locked','payout\_pending','paid\_out','transferred','cancelled','forfeited','admin\_review')),

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now(),

  unique (registration\_id, slot\_number)

);

\-- Payments \-----------------------------------------------------------------

create table payments (

  payment\_id uuid primary key default gen\_random\_uuid(),

  payer\_user\_id uuid not null references users(user\_id),

  stripe\_checkout\_session\_id text unique,

  stripe\_payment\_intent\_id text,

  amount\_cents int not null,

  currency text not null default 'usd',

  status text not null default 'pending'

    check (status in ('pending','succeeded','payment\_mismatch','failed','refunded','partially\_refunded','disputed')),

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now()

);

\-- Authoritative payment \<-\> entry\_slot link (never entry\_slot.payment\_id)

create table payment\_entry\_allocations (

  allocation\_id uuid primary key default gen\_random\_uuid(),

  payment\_id uuid not null references payments(payment\_id) on delete cascade,

  entry\_slot\_id uuid not null references registration\_entry\_slots(entry\_slot\_id),

  amount\_cents int not null,

  created\_at timestamptz not null default now(),

  unique (payment\_id, entry\_slot\_id)

);

create table payment\_events (

  payment\_event\_id uuid primary key default gen\_random\_uuid(),

  payment\_id uuid references payments(payment\_id),

  stripe\_event\_id text unique not null,

  event\_type text not null,

  payload jsonb not null,

  processed\_at timestamptz,

  created\_at timestamptz not null default now()

);

\-- Payouts \--------------------------------------------------------------

create table payout\_entitlements (

  entitlement\_id uuid primary key default gen\_random\_uuid(),

  entry\_slot\_id uuid not null references registration\_entry\_slots(entry\_slot\_id),

  holder\_user\_id uuid not null references users(user\_id),

  status text not null default 'pending'

    check (status in ('pending','active','locked','payout\_pending','paid\_out','transferred','cancelled','forfeited','admin\_review')),

  locked\_at timestamptz,

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now(),

  unique (entry\_slot\_id)

);

create table entitlement\_transfers (

  transfer\_id uuid primary key default gen\_random\_uuid(),

  entitlement\_id uuid not null references payout\_entitlements(entitlement\_id),

  from\_user\_id uuid references users(user\_id),

  to\_user\_id uuid not null references users(user\_id),

  reason text,

  approved\_by\_admin\_id uuid references users(user\_id),

  created\_at timestamptz not null default now()

);

create table prize\_allocations (

  prize\_allocation\_id uuid primary key default gen\_random\_uuid(),

  tournament\_id uuid not null references tournaments(tournament\_id),

  placement int not null,

  placement\_prize\_cents int not null,

  entry\_share\_value\_cents int not null,

  created\_at timestamptz not null default now(),

  unique (tournament\_id, placement)

);

create table payouts (

  payout\_id uuid primary key default gen\_random\_uuid(),

  prize\_allocation\_id uuid not null references prize\_allocations(prize\_allocation\_id),

  recipient\_user\_id uuid not null references users(user\_id),

  total\_amount\_cents int not null,

  status text not null default 'pending\_review'

    check (status in ('pending\_review','approved','processing','paid','failed','cancelled')),

  approved\_by\_admin\_id uuid references users(user\_id),

  approved\_at timestamptz,

  paid\_at timestamptz,

  created\_at timestamptz not null default now(),

  unique (prize\_allocation\_id, recipient\_user\_id)

);

create table payout\_line\_items (

  line\_item\_id uuid primary key default gen\_random\_uuid(),

  payout\_id uuid not null references payouts(payout\_id) on delete cascade,

  entitlement\_id uuid not null references payout\_entitlements(entitlement\_id),

  amount\_cents int not null

);

\-- Refunds / chargebacks \--------------------------------------------------

create table refunds (

  refund\_id uuid primary key default gen\_random\_uuid(),

  payment\_id uuid not null references payments(payment\_id),

  entry\_slot\_id uuid not null references registration\_entry\_slots(entry\_slot\_id),

  payer\_user\_id uuid not null references users(user\_id),

  refund\_amount\_cents int not null,

  reason text,

  status text not null default 'requested'

    check (status in ('requested','under\_review','approved','processing','completed','failed','rejected')),

  stripe\_refund\_id text,

  requested\_at timestamptz not null default now(),

  approved\_at timestamptz,

  processed\_at timestamptz

);

create table chargebacks (

  chargeback\_id uuid primary key default gen\_random\_uuid(),

  payment\_id uuid not null references payments(payment\_id),

  entry\_slot\_id uuid not null references registration\_entry\_slots(entry\_slot\_id),

  status text not null default 'chargeback\_pending'

    check (status in ('chargeback\_pending','chargeback\_won','chargeback\_lost','replacement\_payment\_required','resolved')),

  stripe\_dispute\_id text,

  created\_at timestamptz not null default now(),

  resolved\_at timestamptz

);

\-- Brackets & matches \-------------------------------------------------------

create table brackets (

  bracket\_id uuid primary key default gen\_random\_uuid(),

  tournament\_id uuid not null references tournaments(tournament\_id),

  format text not null default 'single\_elimination'

    check (format in ('single\_elimination','double\_elimination','round\_robin','group\_stage\_to\_elimination')),

  bracket\_size int not null,

  status text not null default 'pending' check (status in ('pending','active','completed')),

  created\_at timestamptz not null default now()

);

create table bracket\_slots (

  bracket\_slot\_id uuid primary key default gen\_random\_uuid(),

  bracket\_id uuid not null references brackets(bracket\_id) on delete cascade,

  seed int,

  team\_id uuid references teams(team\_id),

  is\_bye boolean not null default false

);

create table matches (

  match\_id uuid primary key default gen\_random\_uuid(),

  tournament\_id uuid not null references tournaments(tournament\_id),

  bracket\_id uuid not null references brackets(bracket\_id),

  round\_number int not null,

  round\_name text,

  match\_number int not null,

  bracket\_position int not null,

  team\_1\_id uuid references teams(team\_id),

  team\_2\_id uuid references teams(team\_id),

  team\_1\_source\_match\_id uuid references matches(match\_id),

  team\_2\_source\_match\_id uuid references matches(match\_id),

  winner\_team\_id uuid references teams(team\_id),

  loser\_team\_id uuid references teams(team\_id),

  status text not null default 'pending'

    check (status in ('pending','ready','in\_progress','awaiting\_confirmation','disputed','completed','forfeited','bye','voided')),

  result\_type text check (result\_type in ('normal','bye','forfeit','double\_forfeit','admin\_score')),

  next\_match\_id uuid references matches(match\_id),

  next\_match\_slot int,

  dispute\_status text,

  version\_number int not null default 1,

  created\_at timestamptz not null default now(),

  updated\_at timestamptz not null default now()

  \-- No advancement-uniqueness constraint here (resolved during Phase 5

  \-- planning, see Section 0): the original placeholder referenced a

  \-- nonexistent source\_match\_id column. finalizeMatch's atomic

  \-- \`UPDATE ... WHERE status NOT IN ('completed','voided')\` provides the

  \-- same one-time-only guarantee without a DB constraint.

);

create table match\_results (

  match\_result\_id uuid primary key default gen\_random\_uuid(),

  match\_id uuid not null references matches(match\_id) on delete cascade,

  submitted\_by\_user\_id uuid not null references users(user\_id),

  series\_score text not null,

  map\_scores jsonb,

  submitted\_at timestamptz not null default now()

);

create table match\_confirmations (

  confirmation\_id uuid primary key default gen\_random\_uuid(),

  match\_id uuid not null references matches(match\_id) on delete cascade,

  confirmed\_by\_user\_id uuid references users(user\_id),

  confirmation\_type text not null check (confirmation\_type in ('manual','auto','admin')),

  confirmed\_at timestamptz not null default now()

);

create table match\_evidence (

  evidence\_id uuid primary key default gen\_random\_uuid(),

  match\_id uuid not null references matches(match\_id) on delete cascade,

  uploaded\_by\_user\_id uuid references users(user\_id),

  file\_url text not null,

  uploaded\_at timestamptz not null default now()

);

create table disputes (

  dispute\_id uuid primary key default gen\_random\_uuid(),

  match\_id uuid not null references matches(match\_id),

  submitted\_by\_user\_id uuid not null references users(user\_id),

  reason text not null,

  description text,

  evidence\_urls text\[\],

  assigned\_admin\_id uuid references users(user\_id),

  resolution text check (resolution in ('original\_result\_upheld','result\_reversed','match\_replay','partial\_replay','team\_disqualified','double\_forfeit','admin\_score','match\_voided')),

  resolution\_notes text,

  status text not null default 'open' check (status in ('open','under\_review','resolved')),

  created\_at timestamptz not null default now(),

  resolved\_at timestamptz

);

create table team\_statistics (

  team\_id uuid primary key references teams(team\_id) on delete cascade,

  matches\_played int not null default 0,

  matches\_won int not null default 0,

  matches\_lost int not null default 0,

  forfeit\_wins int not null default 0,

  forfeit\_losses int not null default 0,

  current\_win\_streak int not null default 0,

  longest\_win\_streak int not null default 0,

  tournaments\_entered int not null default 0,

  tournaments\_won int not null default 0,

  runner\_up\_finishes int not null default 0,

  updated\_at timestamptz not null default now()

);

\-- Grudge matches (no platform restriction — see Section 0\) \-----------------

create table grudge\_matches (

  grudge\_match\_id uuid primary key default gen\_random\_uuid(),

  match\_format text not null,

  platform\_tag text, \-- informational only, not a filter (see Chaos \- Legacy Google Forms)

  entry\_fee\_per\_team\_cents int not null default 0,

  scheduled\_at timestamptz,

  status text not null default 'requested'

    check (status in ('requested','accepted','declined','funded','in\_progress','completed','cancelled')),

  created\_at timestamptz not null default now()

);

create table grudge\_match\_participants (

  participant\_id uuid primary key default gen\_random\_uuid(),

  grudge\_match\_id uuid not null references grudge\_matches(grudge\_match\_id) on delete cascade,

  team\_id uuid references teams(team\_id),

  user\_id uuid references users(user\_id), \-- for 1v1 grudge matches

  side text not null check (side in ('challenger','opponent')),

  entry\_slot\_id uuid references registration\_entry\_slots(entry\_slot\_id)

);

\-- Ops \------------------------------------------------------------------

create table audit\_logs (

  audit\_log\_id uuid primary key default gen\_random\_uuid(),

  actor\_user\_id uuid references users(user\_id),

  action text not null,

  entity\_type text not null,

  entity\_id uuid not null,

  before\_state jsonb,

  after\_state jsonb,

  created\_at timestamptz not null default now()

);

> Note: the `matches` table's advancement-uniqueness constraint (`source_match_id, destination_match_id, destination_slot`) needs a generated column or application-level enforcement since the source is split across `team_1_source_match_id`/`team_2_source_match_id` — flagged here rather than shipped as broken SQL above.

**Remaining tables (no full DDL yet — same conventions, finalized when their phase starts):** `games`, `platforms`, `match_maps`, `match_roster_snapshots`, `substitutions`, `rankings`, `player_statistics`, `seasons`, `season_points`, `notifications`, `discord_role_assignments`, `automation_events`. `team_statistics` is fully specified above as of the Phase 6 pass (scoped to per-match fields only — see Section 0). (`entry_checkout_locks` — decided: folded into `registration_entry_slots.checkout_lock_status`/`checkout_lock_expires_at` rather than a separate table, as already reflected above. `team_invitations` and `registration_rosters` are fully specified above as of the Phase 2 planning pass; `tournament_rules` as of Phase 4. `check_ins` — decided: no separate table for now, `tournament_registrations.checked_in_at` covers Phase 4's needs; revisit if a richer per-player check-in record is ever needed.)

---

## 4\. Entry-slot model

One payable row per required starting-player position — never one lump payment per team. `registration_entry_slots` holds `entry_slot_id`, `slot_number`, `assigned_starter_user_id`, `entry_fee_amount_cents`, `payment_status`, `checkout_lock_status` (+expiry), `payer_user_id`, `payment_id` (cache only), `payout_entitlement_user_id`, `entitlement_status`. Substitutes/reserves/coaches/managers never generate a slot. Team-level `funding_status` on `tournament_registrations` derives from slot state (`unfunded` → `partially_funded` → `fully_funded`); full detail on Chaos \- Entry Slots and Checkout.

## 5\. Payment-allocation model

`payment_entry_allocations` is the single authoritative link between a Stripe payment and the entry slot(s) it funds — `entry_slot.payment_id` is a denormalized read cache only, never written independently. One payment can fund multiple slots (batch payment); one slot is funded by exactly one payment. Full detail on Chaos \- Entry Slots and Checkout.

## 6\. Payout-entitlement model

`payout_entitlements` tracks who owns the prize share tied to each entry slot — defaults to the payer, not the player, and does not move when a substitute swaps into the slot. Entitlements lock before the tournament starts (default: check-in close or roster lock, configurable per tournament). `entitlement_transfers` is the only path to reassign one after creation, and only admin-driven. Full mental model on Chaos-Tournaments-Project-Overview.

## 7\. Prize-allocation model

operations\_share \= total\_entry\_money × operations\_fee\_percentage

prize\_pool \= total\_entry\_money − operations\_share

placement\_prize \= round(computed\_share, prize\_rounding\_increment\_cents)

entry\_share\_value \= placement\_prize ÷ required\_starting\_players

payout\_amount(payer) \= Σ entry\_share\_value for every winning entry that payer owns

Remainder cents (when a split doesn't divide evenly) go to `remainder_allocation_rule` (default: captain's own funded entry) falling back to `remainder_fallback_rule` (default: earliest-funded payer) if the captain didn't fund a winning entry. Worked examples and the corrected brief dollar figure are on Chaos \- Payment and Payout Model.

## 8\. Row Level Security plan

| Table(s) | Public | Authenticated player | Team captain (own team) | Payer (own payments) | Admin |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `teams` | read | read | read/write own | read | read/write |
| `brackets`, `bracket_slots` | read | read | read (no write — bracket generation is admin-only) | read | read/write |
| `matches`, `match_results`, `match_confirmations` | read | read | read/write for own team's matches (submit/confirm/dispute a result, Phase 6), via service layer | read | read/write |
| `team_statistics` | read | read | read | — | read/write |
| `team_members` | — | read own team | read/write own team | — | read/write |
| `team_invitations` | — | read own (as invitee) | read/write own team's invites | — | read/write |
| `tournament_registrations`, `registration_rosters` | — | read own | read/write own team's | — | read/write |
| `tournament_rules` | read | read | read | — | read/write |
| `registration_entry_slots` | — | read own slot | read own team's slots (no payer/entitlement reassignment) | read own funded slots | read/write |
| `payments`, `payment_entry_allocations` | — | — | — | read own | read/write |
| `payment_events` | — | — | — | — | read only (internal webhook audit trail) |
| `payout_entitlements`, `payouts`, `payout_line_items` | — | read own | — | read own | read/write |
| `prize_allocations` | read | read | read | — | read/write |
| `refunds`, `chargebacks` | — | — | — | read own | read/write |
| `disputes`, `match_evidence` | — | read if participant | read/write for own team | — | read/write |
| `audit_logs` | — | — | — | — | read only |

Enforcement notes: RLS policies check `auth.uid()` against `users.supabase_auth_id`, joined through the relevant ownership column. All privileged writes (marking a slot paid, advancing a bracket, approving a payout) go through the service layer using the Supabase **service role** key server-side — RLS on those tables should otherwise deny direct client writes entirely, forcing every write through validated service functions. Public bracket views must select only non-financial columns (never expose payer/entitlement identity per Chaos \- Dashboards and Pages's UI-language requirement).

## 9\. Folder structure

/app

  /(public)

    /tournaments/\[slug\]/{register,entries,bracket,standings}

    /grudge-matches/{create,\[id\]}

    /teams/{create,\[id\]/{roster,entries}}

    /pay/\[entry-link\]

  /(auth)

    /login

    /auth/callback

  /dashboard

    /player /captain /sponsor /payments /payouts

  /admin

    /tournaments /registrations /entry-slots /payments /entitlements

    /brackets /matches /disputes /refunds /chargebacks /payouts

  /api

    /stripe/webhook

    /discord/bot-events (if not a separate process)

/services

  entrySlotService.ts  paymentService.ts  payoutService.ts

  bracketService.ts    matchAdvancementService.ts

  refundService.ts     discordService.ts   n8nNotifyService.ts

/lib

  supabase/{client.ts, server.ts, types.ts}

  stripe.ts   rules/{platformRules.ts, moneyRules.ts, statusEnums.ts}

/components

  /ui  /dashboards  /registration  /brackets

/tests

  /unit  /integration

Centralized rule/enum files under `/lib/rules` are where the brief's "avoid hard-coded platform/tournament/payment rules" requirement gets enforced in code — see Chaos \- Tech Stack and Architecture.

## 10\. Environment variables

| Variable | Purpose |
| :---- | :---- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client-side Supabase access (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only, bypasses RLS for validated service-layer writes |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout \+ webhook verification |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | OAuth |
| `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` | bot process |
| `N8N_WEBHOOK_BASE_URL`, `N8N_API_KEY` | outbound automation triggers |
| `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` | reporting sync |
| `APP_BASE_URL` | redirect URLs (Stripe success/cancel, Discord OAuth callback) |

## 11\. Auth flow

Discord OAuth via Supabase Auth: user clicks Login → Supabase redirects to Discord → user authorizes → Discord redirects to `/auth/callback` with code → Supabase exchanges code, creates/updates `auth.users` row → app upserts `users`/`discord_accounts` (username, avatar, discord\_user\_id) → user lands back on the page they originally opened (tournament, registration, grudge match, team, dashboard, or a payment link — see Chaos \- Authentication and Roles).

## 12\. Stripe payment flow

User selects unpaid entry slots (own, others', or both) → server validates slot eligibility and computes the authoritative total → `entrySlotService` locks the selected slots (`checkout_lock_status = locked_for_checkout`, expiry set) → server creates a Stripe Checkout Session with metadata (`tournament_id`, `registration_id`, `team_id`, `payer_user_id`, `payer_discord_user_id`, `entry_slot_ids`, `entry_slot_count`, `entry_fee_per_slot`, `checkout_total`, `division`, `registration_type`, `currency`) → user redirected to Stripe-hosted Checkout → on success/cancel, browser redirects to `/payment/success` or `/payment/cancelled` — **neither redirect marks anything paid**. See Chaos \- Entry Slots and Checkout.

## 13\. Stripe webhook flow

`checkout.session.completed` → verify signature → load session → verify payer → verify entry-slot IDs → verify Stripe's total matches the server-calculated total → verify slots are still eligible (not expired/reassigned) → record payment row → mark slots paid → record payer per slot → set payout entitlement to payer, mark entitlement active → release locks → recalculate team funding status → mark registration fully funded once every required slot is paid → trigger n8n notifications → sync Google Sheets → write audit event. All in one DB transaction; idempotent on `stripe_event_id`. On verification failure: `entry_slot.status = admin_review`, `payment.status = payment_mismatch`, `registration.status = payment_review`.

## 14\. Refund/chargeback flow

**Refund**: request → `under_review` → admin `approved` → Stripe refund issued (`processing`) → `completed`, refunding the *original payer* of each affected slot specifically (never automatically the captain). Partial refunds touch only the affected slots.

**Chargeback**: Stripe dispute webhook → mark affected slots `chargeback_pending` → notify captain \+ payer → recalculate team funding status → hold registration/block check-in if now underfunded → freeze payout entitlements tied to the disputed payment → require replacement payment or admin resolution → `chargeback_won`/`chargeback_lost`/`resolved`. A chargeback never touches unrelated funded entries. Full detail on Chaos \- Refunds and Chargebacks.

## 15\. Bracket data model

`brackets` (one per tournament, `format`, `bracket_size`) → `bracket_slots` (seed, team, is\_bye) → `matches` (round/position, both team-source references for advancement, `next_match_id`/`next_match_slot`, `version_number` for optimistic locking). Bracket size \= next power of 2 ≥ eligible teams; byes go to top seeds first and never touch entry ownership or entitlements. Full detail on Chaos \- Bracket and Match Engine.

## 16\. Match-advancement service

finalizeMatch(matchId, result):

  BEGIN TRANSACTION

    lock match row (SELECT ... FOR UPDATE)

    assert match.status not in ('completed','voided')

    assert result score is valid for match.best\_of

    assert no open dispute on this match

    save winner/loser, match.status \= 'completed'

    mark loser eliminated

    find destination match/slot via next\_match\_id/next\_match\_slot

    insert winner into destination slot

    check destination match readiness (both slots filled?) \-\> status 'ready'

    notify both teams (queue n8n event)

    write audit log

  COMMIT

Idempotency: unique constraint target is `(source_match_id, destination_match_id, destination_slot)` — application-enforced today since the schema splits source across two columns (see schema note above). A completed match can only be reopened by an explicit admin action, never by re-running this service.

## 17\. Payout-calculation service

onTournamentComplete(tournamentId):

  for each placement (1st, 2nd, 3rd):

    compute placement\_prize (rounded to prize\_rounding\_increment\_cents)

    entry\_share\_value \= placement\_prize / required\_starting\_players

    for each winning entry\_slot:

      credit entry\_share\_value to entry\_slot.payout\_entitlement\_user\_id

  group credited amounts by holder\_user\_id \-\> payout rows (status \= pending\_review)

  generate payout\_line\_items per contributing entitlement

  apply remainder\_allocation\_rule / remainder\_fallback\_rule for any leftover cents

  require admin approval before status moves to 'approved' \-\> 'processing' \-\> 'paid'

  prevent duplicate payout generation per tournament (unique constraint on prize\_allocation \+ recipient)

## 18\. Discord integration architecture

OAuth (login) lives in Supabase Auth directly. A separate bot process (long-running Node service, or scheduled Edge Function polling) handles: role assignment (platform, tournament-status, event-specific roles per Chaos \- Discord and Automation), slash commands (`/checkin`, `/roster`, `/entries`, `/payment-status`, `/sponsor-entry`, `/match`, `/bracket`, `/report-score`, `/confirm-score`, `/dispute`, `/request-admin`, `/accept-grudge`, `/decline-grudge`, `/match-status`, `/rules`), and notifications triggered by n8n (never by the bot reading the DB directly for authoritative state — it calls the same service layer). Discord never stores or exposes payout amounts publicly.

## 19\. n8n workflow map

| Trigger | Action |
| :---- | :---- |
| Registration created | Confirmation email, Discord notification |
| Entry slot paid | Payment receipt, Discord role update, Sheets sync |
| Payment reminder schedule | Entry-payment reminder |
| Check-in window opens | Check-in reminder |
| Match result confirmed | Result notification, Sheets sync |
| Dispute opened | Dispute notification to admins |
| Tournament reaches capacity | Tournament-full alert |
| Payout marked pending\_review | Payout-review alert to admin |
| Payout paid | Payout notification to recipient |
| Refund processed | Refund notification |

n8n never confirms payment, calculates payout ownership, advances brackets, or finalizes results — see Chaos \- Discord and Automation.

## 20\. Mobile wireframe outline

Primary journey (see Chaos \- Dashboards and Pages for full detail): tournament page → Register (Discord login if needed) → platform division → create/select team → roster (starters/subs/reserves/coaches/managers, validated against platform \+ starter count) → **Entry Funding** screen (per-slot: unpaid/pending/paid, "pay for self" / "pay for others" selectors, running total) → Stripe Checkout → webhook confirms → funded-status screen → Rules acceptance → Check-in → bracket/standings.

Registration progress stepper: `Login → Platform → Team → Roster → Entry Funding → Rules → Check-In → Complete`. Sponsor-payment stepper: `Select Entries → Review Ownership → Pay → Confirmation`. Every screen: large tap targets, sticky CTA, explicit payer/payout-entitlement language before any payment ("By paying this entry, you become the payout-entitlement holder for the prize share connected to this entry").

## 21\. Admin dashboard outline

Filterable list views across tournament/division/platform, payment status, funding status, entitlement holder, chargeback/mismatch review, check-in, roster completeness, team approval, match state, disputes, payout status, refund status. Actions: approve/reject registration; open/close tournament; lock/unlock roster; approve substitution; review sponsorship; correct payer assignment; lock entitlements; review transfers; seed/regenerate bracket; start tournament; enter/reverse results; resolve disputes; forfeit/disqualify; reopen/repair bracket; approve/process refunds; approve/mark-paid payouts; review chargebacks; export data. Every action writes to `audit_logs`.

## 22\. Sponsor dashboard outline

Entries available to sponsor, entries locked for checkout, entries funded — each showing player/team/tournament, amount paid, potential and actual prize share, entitlement lock date, refund/chargeback status, payout status. Downloadable: payment receipt, sponsorship confirmation, entitlement summary, refund confirmation, payout confirmation. UI copy must always say "You funded this entry" / "You own the payout share connected to this entry" — never anything implying the sponsored player owns the payout.

## 23\. Risks or contradictions

Live list maintained on Chaos \- Open Risks and Contradictions. Active as of 2026-07-29:

- Legacy Google Form fixes blocked on `admin@chaostournaments.com` Chrome access.  
- No email connector; admin-panel/DNS/registrar access unconfirmed.  
- Brand logo file has no real alpha transparency — needs re-export before use in the new build.

Resolved this build-planning pass (game identity, tenancy, tournament vs. grudge platform rules) are in Section 0 above and fully detailed on the Open Risks page. Resolved during Phase 2 planning (2026-07-31): `team_invitations` field list and consent flow, the Phase 2/Phase 4 registration-flow boundary, and the missing `maximum_coaches`/`maximum_managers` columns — all in Section 0 above.

## 24\. Configurable decisions

Everything below lives in `tournament_settings` (per-tournament) rather than hardcoded: `operations_fee_percentage`, `prize_rounding_increment_cents`, `remainder_allocation_rule`, `remainder_fallback_rule`, `double_no_show_policy`, `auto_confirmation_enabled`/`_window_minutes`/`_value_threshold`, `allow_payer_to_sponsor_opposing_teams` (scoped at the tournament level — any two teams in the same tournament), `seeding_method`, `entitlement_lock_at` trigger point, `required_starting_players`/`maximum_substitutes`/`maximum_reserves`/`maximum_coaches`/`maximum_managers`, `best_of`. Qualifier→championship entry-fee carryover: identical-fee slots carry over automatically; a fee mismatch triggers a fresh registration.

## 25\. First implementation milestone

Matches Build Phase 1 ("Foundation") from Chaos \- Build Plan and Business Rules — scoped small on purpose, per the brief's "build incrementally" instruction:

1. Next.js \+ Supabase project scaffold, repo folder structure per Section 9 above.  
2. Discord OAuth login working end-to-end (`/login` → `/auth/callback` → `users`/`discord_accounts` populated).  
3. `teams`, `team_members` tables \+ team creation UI (no entry slots, no payments yet).  
4. Mobile-first nav shell \+ the core route map from Section 9\.  
5. Admin auth gate (role check, empty `/admin` shell).  
6. `tournaments`, `tournament_settings` tables \+ a minimal admin tournament-creation form (no registration flow yet).

**Acceptance criteria**: a user can log in with Discord, create a team, and an admin can create a tournament — with zero payment, bracket, or Discord-bot code written yet. That boundary is intentional; Phase 2 (rosters & entry slots) starts only after this is reviewed.

**Status**: reviewed and complete as of 2026-07-31, tested end-to-end against a live Supabase project (including fixing an RLS self-recursion bug and missing role grants found only by testing the real login flow).

## 25a\. Second implementation milestone

Matches Build Phase 2 ("Rosters and Entry Slots") from Chaos \- Build Plan and Business Rules, scoped per the Phase 2 planning decisions in Section 0 above:

1. `team_invitations` table \+ invite/accept/decline flow (captain invites an existing user by Discord username; roster membership is never created without the invitee's consent).  
2. Full roster management UI on `/teams/[id]/roster`: add confirmed members as starter/substitute/reserve/coach/manager, enforcing `required_starting_players`/`maximum_substitutes`/`maximum_reserves`/`maximum_coaches`/`maximum_managers` and platform-vs-division validation (every starter/sub/reserve must match the team's division; coaches/managers are exempt).  
3. `maximum_coaches`/`maximum_managers` columns added to `tournaments`.  
4. `tournament_registrations` \+ `registration_rosters` tables, and a minimal "register this team for this tournament" action: validates division match and `starter_count == required_starting_players` (blocking with an explanation otherwise, per the brief's Section 19 pseudocode), then creates the registration and snapshots the roster.  
5. `registration_entry_slots` table \+ generation logic: one row per required starter position, `entry_fee_amount_cents` from the tournament, `payment_status = 'unpaid'` — no Stripe integration yet.  
6. Entry Funding screen: read-only view of each slot's unpaid/paid status. No checkout, no payment, no Stripe code — that's Phase 3 ("Payments and Sponsorship") per the brief's own phase split.

**Acceptance criteria**: a captain can invite a player, the player can accept, the roster can be built up to a valid starting lineup, the team can register for a tournament, and the registration produces the correct number of unpaid entry slots — with zero Stripe/checkout code written yet.

**Status**: reviewed and complete as of 2026-07-31.

## 25b\. Third implementation milestone

Matches the core-payment-loop slice of Build Phase 3 ("Payments and Sponsorship") from Chaos \- Build Plan and Business Rules, scoped per the Phase 3 planning decisions in Section 0 above:

1. `payments`, `payment_entry_allocations`, `payment_events` tables per Section 3 DDL.
2. Entry-selection UI on the Entry Funding screen (`/teams/[id]/entries`): captain selects unpaid entries to pay, running total shown, explicit payout-entitlement language before payment per Section 20.
3. Checkout locking: selected slots lock (`checkout_lock_status = 'locked_for_checkout'`, 30-minute expiry matching the Stripe Checkout Session's own expiry) before the Stripe session is created; a partial lock claim rolls back cleanly.
4. Stripe Checkout Session creation: server-calculated total (never trusts the client), one line item per entry, dynamic payment methods (no hardcoded `payment_method_types`), the metadata fields from Section 12.
5. Webhook handler (`/api/stripe/webhook`) for `checkout.session.completed` and `checkout.session.expired`: signature verification, idempotency via a unique constraint on `stripe_event_id`, full re-validation of slot eligibility and amount before marking anything paid, funding-status recalculation, and the verification-failure path (`payment_mismatch`/`admin_review`/`payment_review`) per Section 13.
6. `/payment/success` and `/payment/cancelled` pages — informational only, per "the browser redirect never marks anything paid."

**Deliberately not included** (deferred to a later pass): the standalone `/pay/[entry-link]` sponsor flow for non-team-members, a dedicated sponsor dashboard, downloadable receipts/PDFs, refunds, and chargebacks.

**Acceptance criteria**: a captain can select one or more unpaid entries, complete a real Stripe test-mode Checkout session, and have the webhook correctly mark those entries paid, set the payout entitlement to the payer, and recalculate the registration's funding status — verified end-to-end against a live Stripe test-mode Checkout page, not just the API.

**Status**: reviewed and complete as of 2026-07-31.

## 25c\. Fourth implementation milestone

Matches Build Phase 4 ("Tournament Registration") from Chaos \- Build Plan and Business Rules, scoped per the Phase 4 planning decisions in Section 0 above:

1. `tournament_rules` table, set via a rules textarea on the admin tournament-creation form.
2. Public tournament detail page (`/tournaments/[slug]`): name, division, entry fee, status, rules text, and a register CTA that lists the logged-in user's matching-division teams directly on the page.
3. Rules acceptance and check-in added to the Entry Funding screen (`/teams/[id]/entries`): captain views the rules and accepts (sets `rules_accepted_at`), then checks in (sets `checked_in_at`) once `funding_status = 'fully_funded'`, rules are accepted, and (if configured) the tournament's check-in window is open.
4. Admin registration approval (`/admin/registrations`): list with funding/rules/check-in status, approve/reject action.
5. `/registration/success` and `/registration/cancelled` — the registration action now redirects to the success page (with links to Team Entries, Edit Roster, and the tournament page) instead of straight to the entries screen.

**Acceptance criteria**: a captain can open a tournament page, register a team from it, land on a confirmation page, fund the entries, accept the rules, and check in — with check-in correctly blocked until funding and rules acceptance are both done and the check-in window (when configured) is open — and an admin can approve or reject the registration. Verified against the live database using the real service-layer functions, including the check-in gating and window-enforcement failure paths, not just the success path. Additionally click-tested through the actual rendered UI (team creation → admin tournament creation → public tournament page → register → confirmation page), which caught a JSX whitespace bug the service-layer tests couldn't have — a reminder that DB-level verification and UI-level verification catch different classes of bug.

**Status**: reviewed and complete as of 2026-07-31.

## 25d\. Fifth implementation milestone

Matches Build Phase 5 ("Bracket Engine") from Chaos \- Build Plan and Business Rules, scoped per the Phase 5 planning decisions in Section 0 above:

1. `brackets`, `bracket_slots`, `matches`, `match_results`, `match_confirmations` tables per Section 3 DDL (advancement-uniqueness constraint resolved by omission, per Section 0).
2. Bracket generation (`bracketService.generateBracket`): eligibility gate (approved + fully funded + checked in), bracket size = next power of 2, standard recursive seed placement (top seeds separated, byes distributed rather than clustered), byes auto-completed and cascaded into the next round at generation time, tournament moved to `in_progress`.
3. Match advancement (`matchAdvancementService.finalizeMatch`): score validation against `best_of` (`required_wins = floor(best_of/2)+1`), atomic idempotent completion, winner inserted into the destination match's slot, destination marked `ready` once both slots are filled, tournament marked `completed` on the final match.
4. Admin tournament hub (`/admin/tournaments/[id]`): Generate Bracket action, match list by round, Enter Result form per ready match.
5. Public bracket page (`/tournaments/[slug]/bracket`): bracket tree by round, non-financial columns only, winners highlighted.

**Acceptance criteria**: a 5-team tournament (deliberately not a power of 2, to exercise byes) can have its bracket generated, correctly producing an 8-team bracket with exactly 3 byes assigned to the top 3 seeds and distributed across different first-round matches (not clustered), with byes auto-advancing into round 2; round names match the brief's exact examples (Quarterfinals/Semifinals/Championship); invalid scores are rejected; the bracket can be played out match-by-match through a real admin UI session to a champion, with the tournament correctly marked `completed`; and re-finalizing an already-completed match is rejected. Verified with 20 automated checks against the real service-layer functions plus live UI click-testing, which caught and fixed two real bugs: a `{ head: true }` count-query bug showing "0 eligible teams" on the admin page, and a `null === null` false-positive winner highlight on the public bracket page.

---

## 25e\. Sixth implementation milestone

Matches Build Phase 6 ("Results & Disputes") from Chaos \- Build Plan and Business Rules, scoped per the Phase 6 planning decisions in Section 0 above:

1. `match_evidence`, `disputes`, `team_statistics` tables per Section 3 DDL, plus a public `match-evidence` Supabase Storage bucket for scoreboard-screenshot uploads (service-role client bypasses storage RLS on write, matching the rest of this build).
2. Result submission and confirmation (`matchAdvancementService.submitResult`/`confirmResult`/`disputeResult`): captain submits a tentative winner + series score + optional evidence, opposing captain confirms (shared `completeMatch` core with Phase 5's admin path, now also bumping `team_statistics`) or disputes (blocks advancement, opens a `disputes` row); both confirm and dispute reject the submitting team's own captain.
3. Admin dispute resolution (`resolveDispute`, 8 resolution branches) and forfeit handling (`forfeitMatch`, single and double forfeit, double forfeit driven by `tournament_settings.double_no_show_policy`).
4. Auto-confirmation (`maybeAutoConfirm`): lazy, page-load-triggered check against `auto_confirmation_enabled`/`_window_minutes`/`_value_threshold_cents` and evidence presence.
5. Captain match UI (`/teams/[id]/matches/[matchId]`): submit-result form, confirm/dispute actions, status-appropriate read-only views; admin disputes UI (`/admin/disputes`) with a resolution form; admin tournament hub gained a forfeit action per ready/awaiting-confirmation match.

**Acceptance criteria**: an 8-team tournament can be played to a champion exercising all 7 match-resolution paths (normal confirm, dispute-and-uphold, dispute-and-reverse, dispute-and-replay-then-resubmit, forfeit, dispute-and-disqualify, admin-score), plus separate double-forfeit and auto-confirmation tournaments — all with correct `team_statistics` bookkeeping throughout. Verified with 32 automated checks against the real service-layer functions across three synthetic tournaments, plus 18 live UI click-testing checks driving the full captain-submit → opponent-confirm/dispute → admin-resolve flow through real signed-in browser sessions for four different captains and an admin. Testing caught and fixed one real bug: `disputeResult` was missing the same "disputer can't be the original submitter" symmetry check that `confirmResult` already had, letting a captain dispute their own submitted result and prematurely lock the match out of a legitimate opposing dispute.

---

## 25f\. Seventh implementation milestone

Matches Build Phase 7 ("Prize Allocation & Payouts") from Chaos \- Build Plan and Business Rules, scoped per the Phase 7 planning decisions in Section 0 above:

1. `payout_entitlements`, `entitlement_transfers`, `prize_allocations`, `payouts`, `payout_line_items` tables per Section 3 DDL (activated — deferred since Phase 3 — with two missing constraints added: `payout_entitlements.entry_slot_id unique`, `payouts (prize_allocation_id, recipient_user_id) unique`). `team_statistics` gains `tournaments_entered`/`tournaments_won`/`runner_up_finishes`.
2. The Stripe webhook (`paymentService.handleCheckoutSessionCompleted`) now writes a `payout_entitlements` row alongside its existing `registration_entry_slots` cache update — `payout_entitlements` is the authoritative entitlement record from this point forward.
3. Payout generation (`payoutService.generatePayoutsForTournament`): triggered automatically from `matchAdvancementService.advanceWinner` when the championship match completes. Computes 1st/2nd place prizes (rounded to `prize_rounding_increment_cents`), splits each into equal per-entry shares, groups credited shares by `payout_entitlement` holder into `payouts` rows (`pending_review`) with itemized `payout_line_items`, applies the remainder-cent rule (`remainder_allocation_rule`/`remainder_fallback_rule`), and bumps the placement `team_statistics` fields. Also closes a small Phase 5 gap by marking `brackets.status = 'completed'` at the same trigger point.
4. Admin payout review (`payoutService.approvePayout`/`markPayoutPaid`) and a new `/admin/payouts` page: approve a pending payout, then mark it paid (which also flips its entitlements to `paid_out`).

**Acceptance criteria**: a 4-team, 3-required-starters tournament with prize amounts chosen to force a cents-level remainder on both placements can be played to a champion, correctly producing exactly 2 `prize_allocations` rows (1st/2nd place only — a configured `third_place_prize_cents` is confirmed *not* distributed), payouts grouped and totaled correctly per entitlement holder including the remainder-cent rule and its fallback (proven by a case where the fallback recipient holds *fewer* winning entries than the non-recipient, so the assertion can't pass by coincidence), correct `team_statistics` increments for the champion, runner-up, and a non-placing eligible team, and a full admin approve → mark-paid lifecycle exercised through a real signed-in browser session. Verified with 29 automated checks against the real service-layer functions plus 9 live UI click-testing checks. Testing caught and fixed one real bug: the admin payouts page's Supabase query embedded `users` without disambiguating which of `payouts`' two foreign keys to `users` (`recipient_user_id` vs. `approved_by_admin_id`) it meant, so PostgREST rejected the query and the page silently rendered "No payouts awaiting review" regardless of actual data — caught only by driving the real page in a browser, not by the service-layer tests, which never touch that query.

---

## Related pages

- Chaos-Tournaments-Project-Overview  
- Chaos \- Build Plan and Business Rules  
- Chaos \- Tech Stack and Architecture  
- Chaos \- Database Schema  
- Chaos \- Entry Slots and Checkout  
- Chaos \- Payment and Payout Model  
- Chaos \- Refunds and Chargebacks  
- Chaos \- Bracket and Match Engine  
- Chaos \- Discord and Automation  
- Chaos \- Dashboards and Pages  
- Chaos \- Authentication and Roles  
- Chaos \- Open Risks and Contradictions

