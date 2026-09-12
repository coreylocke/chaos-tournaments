import { REST, Routes } from "discord.js";
import { env } from "./env.js";
import { commands } from "./commands/index.js";

/**
 * Registers slash commands to the guild directly (not globally) — guild commands propagate
 * instantly, global commands can take up to an hour. Fine for a single-server bot. Re-run
 * this any time commands are added/changed; it's a one-off script, not run on every boot.
 */
async function main() {
  const rest = new REST().setToken(env.discordBotToken);
  const body = commands.map((c) => c.data.toJSON());

  await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId), { body });
  console.log(`Registered ${body.length} guild slash commands: ${commands.map((c) => c.data.name).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
