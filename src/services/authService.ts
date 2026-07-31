import "server-only";
import type { User } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Populates users/discord_accounts from a freshly authenticated Supabase
// auth user. Called once from /auth/callback after the OAuth code exchange.
// Uses the service-role client per CLAUDE.md Section 8 — this is a
// privileged write, not something the RLS policies allow directly.
export async function upsertUserFromAuth(authUser: User) {
  const supabase = createServiceRoleClient();

  const meta = authUser.user_metadata ?? {};
  const discordUserId: string | undefined =
    meta.provider_id ?? meta.sub ?? undefined;
  const discordUsername: string =
    meta.full_name ?? meta.name ?? meta.custom_claims?.global_name ?? "unknown";
  const discordAvatarUrl: string | undefined = meta.avatar_url;

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        supabase_auth_id: authUser.id,
        email: authUser.email,
      },
      { onConflict: "supabase_auth_id" }
    )
    .select()
    .single();

  if (userError) throw userError;

  if (discordUserId) {
    const { error: discordError } = await supabase
      .from("discord_accounts")
      .upsert(
        {
          user_id: user.user_id,
          discord_user_id: discordUserId,
          discord_username: discordUsername,
          discord_display_name: meta.full_name ?? null,
          discord_avatar_url: discordAvatarUrl ?? null,
        },
        { onConflict: "discord_user_id" }
      );

    if (discordError) throw discordError;
  }

  return user;
}
