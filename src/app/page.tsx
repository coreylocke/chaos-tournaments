import Image from "next/image";
import Link from "next/link";
import ParticleFieldCanvas from "@/components/ParticleFieldCanvas";
import ScrollReveal from "@/components/ScrollReveal";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Log in with Discord",
    body: "No new account, no password. One click and you're in.",
  },
  {
    step: "02",
    title: "Build your team",
    body: "Team members must sign into the website with Discord to be added to a team roster.",
  },
  {
    step: "03",
    title: "Fund your entry",
    body: "Pay your own slot, sponsor a teammate, or split the team fee.",
  },
  {
    step: "04",
    title: "Compete for the pool",
    body: "Live brackets, automatic advancement, and payouts that follow the entry.",
  },
];

const STATS = [
  { label: "Built for", value: "PC & Console" },
  { label: "Payout model", value: "Per-entry, fair" },
  { label: "Login", value: "Discord only" },
  { label: "Brackets", value: "Live & automatic" },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Continuous 3D particle field: one fixed layer behind every section, so
          the effect flows across the whole landing page while scrolling. */}
      <ParticleFieldCanvas className="pointer-events-none fixed inset-0 z-0" />

      {/* Readability vignette over the particles, keeps text crisp at the edges. */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,10,0.6)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] items-center border-b border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center">
            <Image
              src="/logos/logo-gold-app-icon.svg"
              alt="Chaos Tournaments"
              width={110}
              height={110}
              priority
              className="drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]"
            />
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-chaos-white md:text-7xl">
              Enter the <span className="text-chaos-gold">Chaos</span>
            </h1>
            <p className="max-w-xl text-base text-chaos-white/70 md:text-lg">
              PC and console tournaments and grudge matches. Register your team, fund your
              entry, and fight for the prize pool.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/tournaments"
                className="touch-target flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
              >
                View Tournaments
              </Link>
              <Link
                href="/login"
                className="touch-target flex items-center justify-center rounded-md border border-chaos-gold/50 px-8 text-base font-bold text-chaos-gold transition hover:bg-chaos-gold/10"
              >
                Login with Discord
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <ScrollReveal>
            <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
              How it <span className="text-chaos-gold">works</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal
            stagger
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-white/10 bg-chaos-charcoal p-6 transition hover:border-chaos-gold/40"
              >
                <span className="font-display text-sm font-bold text-chaos-gold/60">
                  {item.step}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold text-chaos-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-chaos-white/70">{item.body}</p>
              </div>
            ))}
          </ScrollReveal>
        </section>

        {/* Tournaments teaser */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <ScrollReveal className="flex flex-col items-center gap-4 text-center">
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
                Open <span className="text-chaos-gold">tournaments</span>
              </h2>
              <p className="max-w-lg text-sm text-chaos-white/70">
                Live tournament listings go here once the bracket engine is wired up. For now,
                head to the full list.
              </p>
              <Link
                href="/tournaments"
                className="touch-target mt-2 flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
              >
                Browse Open Tournaments
              </Link>
            </ScrollReveal>
          </div>
        </section>

        {/* Stats band */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <ScrollReveal
            stagger
            className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-xl font-bold text-chaos-gold md:text-2xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-chaos-white/50">
                  {stat.label}
                </div>
              </div>
            ))}
          </ScrollReveal>
        </section>

        {/* Discord CTA */}
        <section className="border-t border-white/10">
          <ScrollReveal className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center">
            <h2 className="font-display text-2xl font-bold text-chaos-white md:text-3xl">
              Join the community
            </h2>
            <p className="max-w-lg text-sm text-chaos-white/70">
              Match notifications, check-in reminders, and support all happen in Discord.
            </p>
            <Link
              href="/login"
              className="touch-target flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
            >
              Join on Discord
            </Link>
          </ScrollReveal>
        </section>
      </div>
    </div>
  );
}
