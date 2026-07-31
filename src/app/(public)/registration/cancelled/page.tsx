import Link from "next/link";

export default function RegistrationCancelledPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Registration not completed</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Your team wasn&apos;t registered. You can try again from the
        tournament page.
      </p>
      <Link
        href="/tournaments"
        className="flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
      >
        Browse Tournaments
      </Link>
    </div>
  );
}
