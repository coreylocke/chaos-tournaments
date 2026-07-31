"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginButton() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  async function handleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });
  }

  return (
    <button
      onClick={handleLogin}
      className="flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 font-medium text-white transition-colors hover:bg-[#4752C4]"
    >
      Log in with Discord
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Log in to Chaos Tournaments</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        We use Discord for login — no separate password to manage.
      </p>
      <Suspense fallback={null}>
        <LoginButton />
      </Suspense>
    </div>
  );
}
