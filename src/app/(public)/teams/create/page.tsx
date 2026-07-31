import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { TeamCreateForm } from "./TeamCreateForm";

export default async function CreateTeamPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/teams/create");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">Create a team</h1>
      <TeamCreateForm />
    </div>
  );
}
