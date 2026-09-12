import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { env } from "../env.js";

export const data = new SlashCommandBuilder()
  .setName("bracket")
  .setDescription("Show a tournament's bracket link and status")
  .addStringOption((opt) => opt.setName("tournament").setDescription("Tournament name").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("tournament", true);

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name, slug, status, format")
    .ilike("name", `%${name}%`)
    .maybeSingle();

  if (!tournament) {
    await interaction.reply({ content: `No tournament found matching "${name}".`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(tournament.name)
    .setDescription(
      `Status: **${tournament.status.replace(/_/g, " ")}**\nFormat: ${tournament.format.replace(/_/g, " ")}\n[View bracket](${env.siteUrl}/tournaments/${tournament.slug}/bracket)`
    )
    .setColor(0xf1c40f);

  await interaction.reply({ embeds: [embed] });
}
