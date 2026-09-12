type PlaceholderPageProps = {
  title: string;
  body: string;
};

/**
 * Temporary placeholder for routes that will be built out in later phases
 * (Section 56: Phase 3 Payments, Phase 4 Registration, Phase 5 Brackets, etc.)
 */
export default function PlaceholderPage({ title, body }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-lg text-chaos-white/70">{body}</p>
      <span className="mt-6 rounded-full border border-chaos-gold/40 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
        Coming soon
      </span>
    </div>
  );
}
