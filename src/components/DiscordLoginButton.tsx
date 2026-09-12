"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DiscordLoginButtonProps = {
  /** Where to send the user after a successful login (defaults to /dashboard). */
  redirectTo?: string;
  className?: string;
};

/**
 * Discord OAuth sign-in button (Section 4). Wired to Supabase Auth's Discord provider —
 * requires NEXT_PUBLIC_SUPABASE_URL/ANON_KEY and a Discord provider configured in the
 * Supabase dashboard (Client ID/Secret from the Discord Developer Portal).
 */
export default function DiscordLoginButton({
  redirectTo = "/dashboard",
  className,
}: DiscordLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, Supabase redirects the browser to Discord — no further action needed here.
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className={
          className ??
          "touch-target flex w-full items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
        }
      >
        {loading ? "Redirecting to Discord…" : "Login with Discord"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
