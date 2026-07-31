import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { logoutAction } from "@/lib/auth/actions";

const NAV_LINKS = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/teams", label: "Teams" },
  { href: "/grudge-matches", label: "Grudge Matches" },
];

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      {/* Brand + auth CTA: always visible, never part of the scrollable strip below. */}
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/" className="mr-auto shrink-0 font-semibold">
          Chaos
        </Link>

        {user ? (
          <>
            <Link
              href="/dashboard"
              className="flex h-10 shrink-0 items-center rounded-full px-3 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Dashboard
            </Link>
            {user.is_admin && (
              <Link
                href="/admin"
                className="flex h-10 shrink-0 items-center rounded-full px-3 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Admin
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-10 shrink-0 items-center rounded-full bg-zinc-100 px-3 text-sm dark:bg-zinc-900"
              >
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="flex h-10 shrink-0 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Log in
          </Link>
        )}
      </div>

      {/* Section nav: horizontally scrollable on narrow viewports. */}
      <div className="flex h-10 items-center gap-1 overflow-x-auto border-t border-zinc-100 px-4 dark:border-zinc-900">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex h-8 shrink-0 items-center rounded-full px-3 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
