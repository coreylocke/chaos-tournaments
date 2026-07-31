import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col gap-2 px-6 py-12">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-zinc-500">
        Signed in as {user.email ?? user.user_id}. Player, captain, sponsor,
        payments, and payouts views arrive in later phases.
      </p>
    </div>
  );
}
