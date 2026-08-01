import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!user.is_admin) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <nav className="flex gap-4 border-b border-zinc-200 px-6 py-4 text-sm dark:border-zinc-800">
        <Link href="/admin" className="font-medium">
          Admin
        </Link>
        <Link href="/admin/tournaments" className="text-zinc-500">
          Tournaments
        </Link>
        <Link href="/admin/registrations" className="text-zinc-500">
          Registrations
        </Link>
        <Link href="/admin/disputes" className="text-zinc-500">
          Disputes
        </Link>
        <Link href="/admin/payouts" className="text-zinc-500">
          Payouts
        </Link>
      </nav>
      {children}
    </div>
  );
}
