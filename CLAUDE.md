---

## title: Chaos \- Claude Deliverables type: spec last-updated: 2026-07-31 tags: \[chaos-tournaments, architecture, pre-build, spec\]

# Chaos \- Claude Deliverables

**Summary**: The 25-item pre-Phase-1 spec required by the master build brief (Section 57, originally "Hermes Deliverables" — see Chaos \- Build Plan and Business Rules for why it's renamed), plus the Section 25a Phase 2 milestone added once Phase 1 shipped. This is the architecture, schema, flows, and implementation milestones that guide each build phase. This is the standalone copy — drop it into the site repo as `docs/CLAUDE.md` so Claude Code has full context without needing the wiki vault.

**Sources**: Synthesized from every Chaos Tournaments detail page in this wiki, all of which trace back to `raw/Chaos MASTER BUILD BRIEF.md`, plus decisions made directly with Corey on 2026-07-29 (game identity, tenancy, platform rules) and 2026-07-31 (Phase 2 planning: team invitations, Phase 2/4 registration split, coach/manager roster caps).

**Last updated**: 2026-07-31

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

\-- Registration & entry slots \---------------------------------------------

create table tournament\_registrations (

  registration\_id uuid primary key default gen\_random\_uuid(),

  tournament\_id uuid not null references tournaments(tournament\_id),

  team\_id uuid not null references teams(team\_id),

  funding\_status text not null default 'unfunded'

    check (funding\_status in ('unfunded','partially\_funded','fully\_funded','payment\_mismatch','refund\_pending','partially\_refunded','refunded','chargeback\_review','admin\_review')),

  rules\_accepted\_at timestamptz,

  checked\_in\_at timestamptz,

  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),

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

  updated\_at timestamptz not null default now()

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

  created\_at timestamptz not null default now()

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

  created\_at timestamptz not null default now()

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

  updated\_at timestamptz not null default now(),

  unique (source\_match\_id, next\_match\_id, next\_match\_slot) \-- placeholder name; enforced via a generated/derived column or application-level check since source is really (team\_1\_source\_match\_id/team\_2\_source\_match\_id)

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

**Remaining tables (no full DDL yet — same conventions, finalized when their phase starts):** `games`, `platforms`, `tournament_rules`, `match_maps`, `match_roster_snapshots`, `substitutions`, `check_ins`, `rankings`, `team_statistics`, `player_statistics`, `seasons`, `season_points`, `notifications`, `discord_role_assignments`, `automation_events`. (`entry_checkout_locks` — decided: folded into `registration_entry_slots.checkout_lock_status`/`checkout_lock_expires_at` rather than a separate table, as already reflected above. `team_invitations` and `registration_rosters` are now fully specified above as of the Phase 2 planning pass.)

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
| `teams`, `brackets`, `matches` (non-financial columns) | read | read | read/write own | read | read/write |
| `team_members` | — | read own team | read/write own team | — | read/write |
| `team_invitations` | — | read own (as invitee) | read/write own team's invites | — | read/write |
| `tournament_registrations`, `registration_rosters` | — | read own | read/write own team's | — | read/write |
| `registration_entry_slots` | — | read own slot | read own team's slots (no payer/entitlement reassignment) | read own funded slots | read/write |
| `payments`, `payment_entry_allocations` | — | — | — | read own | read/write |
| `payout_entitlements`, `payouts`, `payout_line_items` | — | read own | — | read own | read/write |
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

