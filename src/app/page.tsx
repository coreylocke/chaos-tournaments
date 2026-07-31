import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <Image src="/chaos-logo.svg" alt="Chaos Tournaments" width={120} height={120} priority />

      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Chaos Tournaments</h1>
        <p className="max-w-sm text-zinc-500">
          Rainbow Six Siege tournaments and grudge matches. Register a team,
          fund your entry, and compete.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/tournaments"
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
        >
          Browse Tournaments
        </Link>
        <Link
          href="/teams"
          className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium dark:border-zinc-700"
        >
          View Teams
        </Link>
        {user ? (
          <Link
            href="/dashboard"
            className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium dark:border-zinc-700"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium dark:border-zinc-700"
          >
            Log in with Discord
          </Link>
        )}
      </div>
    </div>
  );
}
