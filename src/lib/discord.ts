/**
 * Discord automation — Section 3 / Section 61 of the master brief ("hands-off for owner").
 *
 * Deliberately a webhook, not a full bot process: a Discord webhook posts messages into a
 * channel with zero hosting (no bot token, no persistent process, no new Docker service —
 * just a URL). Enough to cover "notify the owner/community when X happens." A full bot
 * (slash commands, check-in reminders that need to read state and respond, per-user DMs)
 * needs a real bot application + a persistent process and is a separate, larger project —
 * see docs/wiki/integrations.md for the tradeoff.
 *
 * Configure via DISCORD_WEBHOOK_URL (Discord: channel Settings > Integrations > Webhooks >
 * New Webhook > Copy Webhook URL). No-ops (logs and returns) if unset, so the app works
 * fine without it — notifications just don't go out.
 */
export async function notifyDiscord(content: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("[discord] DISCORD_WEBHOOK_URL not set, skipping notification:", content);
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      console.error("[discord] webhook post failed:", res.status, await res.text());
    }
  } catch (err) {
    // Never let a notification failure break the actual user-facing action.
    console.error("[discord] webhook post threw:", err);
  }
}
