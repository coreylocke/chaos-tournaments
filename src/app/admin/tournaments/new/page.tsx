import { redirect } from "next/navigation";
import CreateTournamentForm from "@/components/CreateTournamentForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewTournamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
        Create a tournament
      </h1>
      <CreateTournamentForm />
    </div>
  );
}
