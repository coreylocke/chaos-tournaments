"use client";

import { useTransition } from "react";
import { setRegistrationStatus } from "@/lib/actions/admin";

export default function RegistrationReviewRow({
  registrationId,
  tournamentSlug,
  teamName,
  statusLabel,
  canReview,
}: {
  registrationId: string;
  tournamentSlug: string;
  teamName: string;
  statusLabel: string;
  canReview: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="text-sm font-semibold text-chaos-white">{teamName}</p>
        <p className="text-xs uppercase tracking-wide text-chaos-white/50">{statusLabel}</p>
      </div>
      {canReview && (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setRegistrationStatus(registrationId, tournamentSlug, "approved"))}
            className="text-xs font-semibold uppercase tracking-wide text-chaos-gold transition hover:underline disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setRegistrationStatus(registrationId, tournamentSlug, "withdrawn"))}
            className="text-xs font-semibold uppercase tracking-wide text-red-400/80 transition hover:text-red-400 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </li>
  );
}
