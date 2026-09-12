/**
 * Central env var loading/validation for the bot process. Fails fast on startup rather than
 * throwing confusing errors later from deep inside discord.js or the Supabase client.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  discordBotToken: required("DISCORD_BOT_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordGuildId: required("DISCORD_GUILD_ID"),
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  botInternalSecret: required("BOT_INTERNAL_SECRET"),
  botInternalPort: Number(process.env.BOT_INTERNAL_PORT ?? 4001),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://chaostournaments.com",
  reminderLeadMinutes: Number(process.env.CHECKIN_REMINDER_LEAD_MINUTES ?? 30),
  reminderPollIntervalMs: Number(process.env.CHECKIN_REMINDER_POLL_MS ?? 5 * 60 * 1000),
};
