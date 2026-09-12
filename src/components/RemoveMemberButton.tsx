"use client";

import { useTransition } from "react";
import { removeTeamMember } from "@/lib/actions/teams";

export default function RemoveMemberButton({
  teamMemberId,
  teamSlug,
}: {
  teamMemberId: string;
  teamSlug: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removeTeamMember(teamMemberId, teamSlug))}
      className="text-xs font-semibold uppercase tracking-wide text-red-400/80 transition hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
