import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { env } from "../env.js";

export const data = new SlashCommandBuilder().setName("rules").setDescription("Get a link to the tournament rules");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply(`📋 Tournament rules: ${env.siteUrl}/rules`);
}
