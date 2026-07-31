// Centralizes money/checkout constants so they're not hardcoded inline,
// per CLAUDE.md Section 9's folder-structure intent for /lib/rules.

// Stripe Checkout Sessions can't expire in less than 30 minutes. Keep the
// DB-side lock expiry in lockstep with the session's own expiry so a lock
// never outlives (or falls short of) the checkout window it protects.
export const CHECKOUT_LOCK_MINUTES = 30;

export function sumEntryFeesCents(
  slots: Array<{ entry_fee_amount_cents: number }>
): number {
  return slots.reduce((total, slot) => total + slot.entry_fee_amount_cents, 0);
}
