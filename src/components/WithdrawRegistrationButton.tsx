"use client";

import { useTransition } from "react";
import { withdrawRegistration } from "@/lib/actions/tournaments";

export default function WithdrawRegistrationButton({
  registrationId,
  tournamentSlug,
}: {
  registrationId: string;
  tournamentSlug: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => withdrawRegistration(registrationId, tournamentSlug))}
      className="text-xs font-semibold uppercase tracking-wide text-red-400/80 transition hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "Withdrawing…" : "Withdraw"}
    </button>
  );
}
