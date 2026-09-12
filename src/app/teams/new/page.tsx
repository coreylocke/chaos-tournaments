import { redirect } from "next/navigation";
import CreateTeamForm from "@/components/CreateTeamForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
        Create a team
      </h1>
      <CreateTeamForm />
    </div>
  );
}
