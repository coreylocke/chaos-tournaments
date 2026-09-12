import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";

export const data = new SlashCommandBuilder()
  .setName("roster")
  .setDescription("Show a team's roster")
  .addStringOption((opt) => opt.setName("team").setDescription("Team name").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const teamName = interaction.options.getString("team", true);

  const { data: team } = await supabase
    .from("teams")
    .select("team_id, team_name, division")
    .ilike("team_name", teamName)
    .maybeSingle();

  if (!team) {
    await interaction.reply({ content: `No team found matching "${teamName}".`, ephemeral: true });
    return;
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("roster_role, game_username, user_profiles(discord_display_name, discord_username)")
    .eq("team_id", team.team_id)
    .eq("is_active", true)
    .order("roster_role");

  const lines = (members ?? []).map((m) => {
    const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles;
    const name = profile?.discord_display_name ?? profile?.discord_username ?? "Unknown";
    return `**${m.roster_role}** — ${name}${m.game_username ? ` (${m.game_username})` : ""}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`${team.team_name} (${team.division === "pc" ? "PC" : "Console"})`)
    .setDescription(lines.length > 0 ? lines.join("\n") : "No active roster members.")
    .setColor(0xf1c40f);

  await interaction.reply({ embeds: [embed] });
}
