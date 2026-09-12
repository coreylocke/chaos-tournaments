import { Client, GatewayIntentBits, Events, type Interaction } from "discord.js";
import { env } from "./env.js";
import { commands } from "./commands/index.js";
import { startInternalApi } from "./internalApi.js";
import { startReminderPoll } from "./reminders.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commandMap = new Map(commands.map((c) => [c.data.name, c]));

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[bot] logged in as ${readyClient.user.tag}`);
  startInternalApi(client);
  startReminderPoll(client);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[bot] command "${interaction.commandName}" failed:`, err);
    const reply = { content: "Something went wrong running that command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(env.discordBotToken);
