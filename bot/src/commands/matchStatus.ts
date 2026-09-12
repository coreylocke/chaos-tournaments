import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";

export const data = new SlashCommandBuilder()
  .setName("match-status")
  .setDescription("Show your team's current match status (ephemeral, only visible to you)");

export async function execute(interaction: ChatInputCommandInteraction) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("discord_user_id", interaction.user.id)
    .maybeSingle();

  if (!profile) {
    await interaction.reply({
      content: "You haven't logged into chaostournaments.com with this Discord account yet.",
      ephemeral: true,
    });
    return;
  }

  const [{ data: captained }, { data: memberOf }] = await Promise.all([
    supabase.from("teams").select("team_id, team_name").eq("captain_user_id", profile.user_id),
    supabase
      .from("team_members")
      .select("teams(team_id, team_name)")
      .eq("user_id", profile.user_id)
      .eq("is_active", true),
  ]);

  const teamIds = new Set<string>();
  for (const t of captained ?? []) teamIds.add(t.team_id);
  for (const m of memberOf ?? []) {
    const t = Array.isArray(m.teams) ? m.teams[0] : m.teams;
    if (t) teamIds.add(t.team_id);
  }

  if (teamIds.size === 0) {
    await interaction.reply({ content: "You're not on any teams yet.", ephemeral: true });
    return;
  }

  const idList = [...teamIds].join(",");
  const { data: matches } = await supabase
    .from("matches")
    .select("round_name, status, team_1_id, team_2_id")
    .in("status", ["ready", "pending"])
    .or(`team_1_id.in.(${idList}),team_2_id.in.(${idList})`);

  if (!matches || matches.length === 0) {
    await interaction.reply({ content: "No active matches for your teams right now.", ephemeral: true });
    return;
  }

  const involvedTeamIds = new Set<string>();
  for (const m of matches) {
    if (m.team_1_id) involvedTeamIds.add(m.team_1_id);
    if (m.team_2_id) involvedTeamIds.add(m.team_2_id);
  }
  const { data: teamRows } = await supabase
    .from("teams")
    .select("team_id, team_name")
    .in("team_id", [...involvedTeamIds]);
  const teamNames = new Map((teamRows ?? []).map((t) => [t.team_id, t.team_name]));

  const lines = matches.map((m) => {
    const t1 = m.team_1_id ? teamNames.get(m.team_1_id) : null;
    const t2 = m.team_2_id ? teamNames.get(m.team_2_id) : null;
    return `**${m.round_name}**: ${t1 ?? "TBD"} vs ${t2 ?? "TBD"} — ${m.status}`;
  });

  const embed = new EmbedBuilder().setTitle("Your match status").setDescription(lines.join("\n")).setColor(0xf1c40f);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
