import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";

/**
 * Ephemeral-only — this touches financial info, and Section 51 of the master brief says
 * payers may view their own financial records, not anyone else's.
 */
export const data = new SlashCommandBuilder()
  .setName("payment-status")
  .setDescription("Show entry fee payment status for registrations you've paid for");

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

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("amount_cents, status, tournament_registrations(tournaments(name))")
    .eq("paid_by", profile.user_id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!payments || payments.length === 0) {
    await interaction.reply({ content: "You haven't paid any entry fees yet.", ephemeral: true });
    return;
  }

  const lines = payments.map((p) => {
    const reg = Array.isArray(p.tournament_registrations) ? p.tournament_registrations[0] : p.tournament_registrations;
    const tournament = Array.isArray(reg?.tournaments) ? reg?.tournaments[0] : reg?.tournaments;
    return `${tournament?.name ?? "Unknown tournament"}: $${(p.amount_cents / 100).toFixed(2)} — **${p.status}**`;
  });

  const embed = new EmbedBuilder().setTitle("Your entry fee payments").setDescription(lines.join("\n")).setColor(0xf1c40f);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
