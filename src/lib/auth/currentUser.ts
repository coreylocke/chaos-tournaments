import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type AppUser = Database["public"]["Tables"]["users"]["Row"];

// Resolves the signed-in Supabase auth user to our own `users` row. Uses the
// anon+RLS client (not service-role) — the "users read own or admin" policy
// already permits a user to read their own row, so no privileged bypass is
// needed just to look yourself up.
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: appUser } = await supabase
    .from("users")
    .select("*")
    .eq("supabase_auth_id", authUser.id)
    .single();

  return appUser;
}
