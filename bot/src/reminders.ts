import type { Client } from "discord.js";
import { supabase } from "./supabase.js";
import { env } from "./env.js";

/**
 * Check-in reminder poll — no formal check-in flow exists yet (Section 22's `checked_in`
 * status is reserved but unused), so this is purely a reminder DM to team captains before
 * their tournament starts, not a gate on anything. Runs on an interval rather than a precise
 * scheduler since a few minutes of slop is fine for a reminder.
 */
export function startReminderPoll(client: Client) {
  const run = () => checkReminders(client).catch((err) => console.error("[reminders] poll failed:", err));
  run();
  setInterval(run, env.reminderPollIntervalMs);
}

async function checkReminders(client: Client) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + env.reminderLeadMinutes * 60 * 1000);

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("tournament_id, name, starts_at")
    .not("starts_at", "is", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", windowEnd.toISOString())
    .in("status", ["open", "closed"]);

  if (!tournaments || tournaments.length === 0) return;

  for (const tournament of tournaments) {
    const { data: registrations } = await supabase
      .from("tournament_registrations")
      .select("registration_id, team_id, teams(team_name, captain_user_id)")
      .eq("tournament_id", tournament.tournament_id)
      .in("registration_status", ["approved", "active"])
      .is("reminder_sent_at", null);

    for (const registration of registrations ?? []) {
      const team = Array.isArray(registration.teams) ? registration.teams[0] : registration.teams;

      if (team) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("discord_user_id")
          .eq("user_id", team.captain_user_id)
          .maybeSingle();

        if (profile?.discord_user_id) {
          try {
            const user = await client.users.fetch(profile.discord_user_id);
            await user.send(
              `⏰ Heads up — **${tournament.name}** starts within ${env.reminderLeadMinutes} minutes. Make sure **${team.team_name}** is ready to go!`
            );
          } catch (err) {
            console.warn(`[reminders] failed to DM ${profile.discord_user_id}:`, err);
          }
        }
      }

      await supabase
        .from("tournament_registrations")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("registration_id", registration.registration_id);
    }
  }
}
