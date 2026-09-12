import DiscordLoginButton from "@/components/DiscordLoginButton";
import PlaceholderPage from "@/components/PlaceholderPage";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function LoginPage() {
  if (!SUPABASE_CONFIGURED) {
    return (
      <PlaceholderPage
        title="Login with Discord"
        body="Discord OAuth sign-in goes live once the Supabase project and Discord application credentials are connected (Phase 1 backend)."
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white">
        Welcome back
      </h1>
      <p className="text-chaos-white/70">
        Log in with Discord to register a team, manage your roster, and track your entries.
      </p>
      <DiscordLoginButton />
    </div>
  );
}
