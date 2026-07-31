import Link from "next/link";
import { stripe } from "@/lib/stripe";

// Purely informational — the redirect here never marks anything paid.
// Only the Stripe webhook (paymentService.handleCheckoutSessionCompleted)
// does that, per CLAUDE.md Section 12.
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let amountCents: number | null = null;
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      amountCents = session.amount_total;
    } catch {
      // Session lookup is best-effort display only.
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        {amountCents != null
          ? `Your payment of $${(amountCents / 100).toFixed(2)} is being confirmed.`
          : "Your payment is being confirmed."}{" "}
        It may take a moment to show as paid.
      </p>
      <Link
        href="/dashboard"
        className="flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
