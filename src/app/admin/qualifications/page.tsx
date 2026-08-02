import { createServiceRoleClient } from "@/lib/supabase/server";
import { linkQualificationAction } from "./actions";

export default async function AdminQualificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: brackets } = await supabase
    .from("brackets")
    .select("bracket_id, status, tournaments(name, division)")
    .order("created_at", { ascending: false });

  const { data: matches } = await supabase
    .from("matches")
    .select("match_id, bracket_id, round_name, team_1_id, team_2_id")
    .or("team_1_id.is.null,team_2_id.is.null");

  const { data: teams } = await supabase.from("teams").select("team_id, team_name");
  const teamName = new Map((teams ?? []).map((t) => [t.team_id, t.team_name]));
  const bracketMeta = new Map(
    (brackets ?? []).map((b) => [
      b.bracket_id,
      (b.tournaments as unknown as { name: string; division: string } | null) ?? { name: "?", division: "?" },
    ])
  );

  const { data: links } = await supabase
    .from("bracket_qualifications")
    .select(
      "bracket_qualification_id, qualification_rule, destination_slot, resolved_at, resolved_team_id, source_bracket_id, destination_match_id"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Bracket Qualifications</h1>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form action={linkQualificationAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium">Link a qualifier to a championship slot</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="source_bracket_id" className="text-sm font-medium">
            Source (qualifier) bracket
          </label>
          <select
            id="source_bracket_id"
            name="source_bracket_id"
            required
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select a bracket…</option>
            {brackets?.map((b) => {
              const meta = b.tournaments as unknown as { name: string; division: string } | null;
              return (
                <option key={b.bracket_id} value={b.bracket_id}>
                  {meta?.name} ({meta?.division}) — {b.status}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="destination_match" className="text-sm font-medium">
            Destination (championship) match with an open slot
          </label>
          <select
            id="destination_match"
            name="destination_match"
            required
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select a match…</option>
            {matches?.flatMap((m) => {
              const meta = bracketMeta.get(m.bracket_id);
              const options = [];
              if (!m.team_1_id) {
                options.push(
                  <option key={`${m.match_id}-1`} value={`${m.bracket_id}|${m.match_id}|1`}>
                    {meta?.name} — {m.round_name} — slot 1 (open, vs{" "}
                    {m.team_2_id ? teamName.get(m.team_2_id) : "TBD"})
                  </option>
                );
              }
              if (!m.team_2_id) {
                options.push(
                  <option key={`${m.match_id}-2`} value={`${m.bracket_id}|${m.match_id}|2`}>
                    {meta?.name} — {m.round_name} — slot 2 (open, vs{" "}
                    {m.team_1_id ? teamName.get(m.team_1_id) : "TBD"})
                  </option>
                );
              }
              return options;
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="qualification_rule" className="text-sm font-medium">
            Qualification rule
          </label>
          <select
            id="qualification_rule"
            name="qualification_rule"
            required
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="bracket_winner">Bracket winner</option>
            <option value="bracket_runner_up">Bracket runner-up</option>
          </select>
        </div>

        <button
          type="submit"
          className="h-11 w-fit rounded-full bg-foreground px-5 text-sm font-medium text-background"
        >
          Create link
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-lg font-medium">Existing links</h2>
        {!links?.length && <p className="text-sm text-zinc-500">No qualification links yet.</p>}
        <ul className="flex flex-col gap-2">
          {links?.map((l) => (
            <li
              key={l.bracket_qualification_id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
            >
              <span>
                {bracketMeta.get(l.source_bracket_id)?.name} ({l.qualification_rule.replace(/_/g, " ")}) → slot{" "}
                {l.destination_slot}
              </span>
              <span className="text-xs text-zinc-500">
                {l.resolved_at
                  ? `resolved: ${l.resolved_team_id ? teamName.get(l.resolved_team_id) : "?"}`
                  : "pending"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
