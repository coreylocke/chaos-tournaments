import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

/**
 * Service-role Supabase client — the bot is a trusted server-side process (same trust level
 * as the Next.js app's admin client), so it bypasses RLS. Never expose this client or its key
 * outside this process.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
