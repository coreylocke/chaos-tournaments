"use client";

import { useActionState } from "react";
import { updatePlatformSettings } from "@/lib/actions/settings";

const inputClass =
  "w-full rounded-md border border-chaos-white/20 bg-black/40 px-3 py-2 text-chaos-white placeholder:text-chaos-white/40 focus:border-chaos-gold focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-chaos-white/80";

export default function PlatformSettingsForm({
  entryFeeCents,
  platformFeePercent,
  winnerSharePercent,
}: {
  entryFeeCents: number;
  platformFeePercent: number;
  winnerSharePercent: number;
}) {
  const [state, formAction, pending] = useActionState(updatePlatformSettings, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-chaos-white/10 bg-chaos-charcoal p-5">
      <div>
        <label htmlFor="entry_fee_dollars" className={labelClass}>
          Entry fee per team ($)
        </label>
        <input
          id="entry_fee_dollars"
          name="entry_fee_dollars"
          type="number"
          min="0"
          step="0.01"
          defaultValue={(entryFeeCents / 100).toFixed(2)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-chaos-white/50">
          Charged once per team registration via Stripe Checkout. Set to 0 to make registration free.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="platform_fee_percent" className={labelClass}>
            Platform cut (%)
          </label>
          <input
            id="platform_fee_percent"
            name="platform_fee_percent"
            type="number"
            min="0"
            max="100"
            step="1"
            defaultValue={platformFeePercent}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="winner_share_percent" className={labelClass}>
            1st place share of net pool (%)
          </label>
          <input
            id="winner_share_percent"
            name="winner_share_percent"
            type="number"
            min="0"
            max="100"
            step="1"
            defaultValue={winnerSharePercent}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-chaos-white/50">Remainder goes to 2nd place.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="touch-target self-start rounded-md bg-chaos-gold px-6 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
