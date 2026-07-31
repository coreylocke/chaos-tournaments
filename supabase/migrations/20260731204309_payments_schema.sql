-- Phase 3 (Payments & Sponsorship): payments, payment_entry_allocations,
-- payment_events, per CLAUDE.md Section 3 DDL. payment_entry_allocations is
-- the authoritative payment<->slot link; registration_entry_slots.payment_id
-- is a denormalized cache only, never written independently.

create table payments (
  payment_id uuid primary key default gen_random_uuid(),
  payer_user_id uuid not null references users(user_id),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending','succeeded','payment_mismatch','failed','refunded','partially_refunded','disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_entry_allocations (
  allocation_id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(payment_id) on delete cascade,
  entry_slot_id uuid not null references registration_entry_slots(entry_slot_id),
  amount_cents int not null,
  created_at timestamptz not null default now(),
  unique (payment_id, entry_slot_id)
);

create table payment_events (
  payment_event_id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(payment_id),
  stripe_event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;
alter table payment_entry_allocations enable row level security;
alter table payment_events enable row level security;

create policy "payments read own or admin" on payments
  for select using (
    payer_user_id = public.current_app_user_id()
    or public.is_admin()
  );

create policy "payment_entry_allocations read own or admin" on payment_entry_allocations
  for select using (
    exists (
      select 1 from public.payments p
      where p.payment_id = payment_entry_allocations.payment_id
        and p.payer_user_id = public.current_app_user_id()
    )
    or public.is_admin()
  );

-- Internal audit trail of raw webhook deliveries — admin only, no
-- player/payer-facing read.
create policy "payment_events admin only" on payment_events
  for select using (public.is_admin());

grant select on payments, payment_entry_allocations, payment_events to anon, authenticated;
grant select, insert, update, delete on payments, payment_entry_allocations, payment_events to service_role;
