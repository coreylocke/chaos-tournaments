"use client";

import { useTransition } from "react";
import { startConnectOnboarding } from "@/lib/actions/payouts";

export default function ClaimPayoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => startConnectOnboarding())}
      className="touch-target rounded-md bg-chaos-gold px-5 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
    >
      {pending ? "Redirecting to Stripe…" : "Set up payout"}
    </button>
  );
}
