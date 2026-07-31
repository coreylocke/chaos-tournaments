-- CLAUDE.md Section 13 (Stripe webhook flow) targets registration.status =
-- 'payment_review' on verification failure, but the tournament_registrations
-- CHECK constraint from the original schema pass never included it. Found
-- while building Phase 3's webhook handler.

alter table tournament_registrations drop constraint tournament_registrations_status_check;
alter table tournament_registrations add constraint tournament_registrations_status_check
  check (status in ('pending','approved','rejected','withdrawn','payment_review'));
