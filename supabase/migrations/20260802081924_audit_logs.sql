-- audit_logs was fully specified in CLAUDE.md Section 3 from the original
-- pre-build spec but never actually migrated in across any prior phase --
-- discovered while wiring opposing-team-sponsorship audit logging in
-- Phase 9 (Tournament Stacking).

create table audit_logs (
  audit_log_id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(user_id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;

-- Section 8: "audit_logs | — | — | — | — | read only" — admin read only,
-- no player/payer-facing read, matching payment_events' treatment.
create policy "audit_logs admin read only" on audit_logs
  for select using (public.is_admin());

grant select on audit_logs to anon, authenticated;
grant select, insert, update, delete on audit_logs to service_role;
