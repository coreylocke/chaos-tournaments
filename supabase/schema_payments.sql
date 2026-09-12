-- Chaos Tournaments — Stripe payments/payouts schema (additive migration)
-- Phase 3 (Stripe): entry fee collection at registration + prize payouts to whoever paid
-- for the winning/runner-up team, via Stripe Connect Express.
--
-- Run in the SQL Editor, same project as the other migrations.
--
-- Model:
--   * A single flat entry fee (admin-editable, starts at $5) is charged per team
--     registration via Stripe Checkout — NOT the per-tournament `entry_fee_per_starting_slot`
--     column from schema_phase2.sql, which is superseded for charging purposes (left in
--     place, unused by the payment flow, harmless if admins leave it at 0).
--   * `registered_by` on tournament_registrations is who registers the team; the payer
--     recorded on registration_payments (usually the same person) is who receives any
--     prize payout if that team places.
--   * When a tournament's championship match completes, the platform takes a cut
--     (platform_fee_percent) off the total collected entry-fee pool; the remainder splits
--     70/30 between whoever paid for the winning team and whoever paid for the runner-up.
--   * Payout recipients must complete Stripe Connect Express onboarding before funds move —
--     the transfer fires automatically the moment onboarding completes (webhook-driven, no
--     admin action required, matching the "hands-off for owner" goal).

-- ============================================================================
-- Platform settings (singleton row, admin-editable)
-- ============================================================================

create table if not exists public.platform_settings (
  id boolean primary key default true check (id),
  entry_fee_cents integer not null default 500 check (entry_fee_cents >= 0),
  platform_fee_percent numeric(5, 2) not null default 20.00 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
  winner_share_percent numeric(5, 2) not null default 70.00 check (winner_share_percent >= 0 and winner_share_percent <= 100),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

create policy "platform_settings are viewable by everyone"
  on public.platform_settings for select using (true);

-- No insert/update/delete policy: writes go exclusively through the service-role client
-- from admin-only server actions (src/lib/actions/settings.ts), same pattern as tournament
-- creation.

drop trigger if exists set_updated_at on public.platform_settings;
create trigger set_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Stripe Connect fields on user_profiles (payout recipient onboarding)
-- ============================================================================

alter table public.user_profiles
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_onboarded boolean not null default false;

-- ============================================================================
-- Registration payments (entry fee checkout, one per registration)
-- ============================================================================

create table if not exists public.registration_payments (
  payment_id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.tournament_registrations (registration_id) on delete cascade,
  paid_by uuid not null references public.user_profiles (user_id),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id)
);

alter table public.registration_payments enable row level security;

create policy "registration_payments viewable by the payer"
  on public.registration_payments for select using (auth.uid() = paid_by);

-- No insert/update/delete policy: writes go exclusively through the service-role client
-- from server actions (creating the Checkout session) and the Stripe webhook handler.

drop trigger if exists set_updated_at on public.registration_payments;
create trigger set_updated_at before update on public.registration_payments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Tournament payouts (prize distribution, one row per placement per tournament)
-- ============================================================================

create table if not exists public.tournament_payouts (
  payout_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (tournament_id) on delete cascade,
  registration_id uuid not null references public.tournament_registrations (registration_id) on delete cascade,
  recipient_user_id uuid not null references public.user_profiles (user_id),
  placement text not null check (placement in ('winner', 'runner_up')),
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'awaiting_onboarding' check (
    status in ('awaiting_onboarding', 'ready', 'paid', 'failed')
  ),
  stripe_transfer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, registration_id)
);

alter table public.tournament_payouts enable row level security;

create policy "tournament_payouts viewable by the recipient"
  on public.tournament_payouts for select using (auth.uid() = recipient_user_id);

-- No insert/update/delete policy: writes go exclusively through the service-role client
-- from the bracket engine (creating payout rows at tournament completion) and the Stripe
-- webhook handler (marking paid once the transfer fires).

drop trigger if exists set_updated_at on public.tournament_payouts;
create trigger set_updated_at before update on public.tournament_payouts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Indexes
-- ============================================================================

create index if not exists idx_registration_payments_paid_by on public.registration_payments (paid_by);
create index if not exists idx_tournament_payouts_recipient on public.tournament_payouts (recipient_user_id);
create index if not exists idx_tournament_payouts_status on public.tournament_payouts (status);
