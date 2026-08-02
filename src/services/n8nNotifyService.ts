import "server-only";

export type ChaosEventType =
  | "registration_created"
  | "match_result_confirmed"
  | "dispute_opened"
  | "payout_pending_review"
  | "payout_paid";

// CLAUDE.md Section 19: n8n is downstream automation only — it never
// confirms payment, calculates payout ownership, advances brackets, or
// finalizes results, so a delivery failure here must never fail the
// calling transaction. Always swallows its own errors (logged, not thrown).
export async function notifyN8n(eventType: ChaosEventType, data: Record<string, unknown>) {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  const secret = process.env.N8N_INBOUND_SECRET;
  if (!baseUrl || !secret) return;

  try {
    await fetch(`${baseUrl}/webhook/chaos-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Chaos-Signature": secret,
      },
      body: JSON.stringify({ event_type: eventType, data }),
    });
  } catch (err) {
    console.error("n8n notification failed:", eventType, err);
  }
}
