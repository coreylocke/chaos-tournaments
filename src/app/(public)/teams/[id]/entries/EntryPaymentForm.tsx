"use client";

import { useState } from "react";
import { payEntriesAction } from "./actions";

type Slot = {
  entry_slot_id: string;
  slot_number: number;
  entry_fee_amount_cents: number;
};

export function EntryPaymentForm({
  teamId,
  unpaidSlots,
}: {
  teamId: string;
  unpaidSlots: Slot[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalCents = unpaidSlots
    .filter((s) => selected.has(s.entry_slot_id))
    .reduce((sum, s) => sum + s.entry_fee_amount_cents, 0);

  return (
    <form action={payEntriesAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input type="hidden" name="team_id" value={teamId} />
      <p className="text-sm font-medium">Select entries to pay</p>
      {unpaidSlots.map((slot) => (
        <label
          key={slot.entry_slot_id}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              name="entry_slot_ids"
              value={slot.entry_slot_id}
              checked={selected.has(slot.entry_slot_id)}
              onChange={() => toggle(slot.entry_slot_id)}
              className="h-4 w-4"
            />
            Entry {slot.slot_number}
          </span>
          <span>${(slot.entry_fee_amount_cents / 100).toFixed(2)}</span>
        </label>
      ))}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-sm font-medium dark:border-zinc-800">
        <span>Total</span>
        <span>${(totalCents / 100).toFixed(2)}</span>
      </div>
      <p className="text-xs text-zinc-500">
        By paying, you become the payout-entitlement holder for the prize share
        connected to each entry you fund.
      </p>
      <button
        type="submit"
        disabled={selected.size === 0}
        className="h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
      >
        Pay {selected.size > 0 ? `$${(totalCents / 100).toFixed(2)}` : ""}
      </button>
    </form>
  );
}
