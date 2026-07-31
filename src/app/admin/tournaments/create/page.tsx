import { TournamentCreateForm } from "./TournamentCreateForm";

export default function CreateTournamentPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold">Create tournament</h1>
      <TournamentCreateForm />
    </div>
  );
}
