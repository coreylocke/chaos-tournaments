import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with registration, payments, matches, disputes, and prize payouts. Chaos Tournaments support runs through the official Discord server.",
};

const TOPICS = [
  {
    title: "Registration & eligibility",
    body: "Team registration, roster rules, eligibility requirements, and Discord sign-in questions.",
    href: "/rules#chapter-1",
  },
  {
    title: "Payments & entries",
    body: "Entry fees, funded slots, sponsorship, and payment questions handled through the Discord server.",
    href: "/rules#chapter-6",
  },
  {
    title: "Check-in & matches",
    body: "Match scheduling, check-in windows, lobby setup, and substitutions.",
    href: "/rules#chapter-3",
  },
  {
    title: "Results & disputes",
    body: "Result reporting, the 15-minute dispute window, and investigation timelines.",
    href: "/rules#chapter-3",
  },
  {
    title: "Sanctions & appeals",
    body: "Warnings, suspensions, and the 48-hour appeal window after a sanction notification.",
    href: "/rules#chapter-5",
  },
  {
    title: "Prizes & payouts",
    body: "Tax documentation, Stripe payment process, and prize payment timelines.",
    href: "/rules#chapter-6",
  },
];

const CHANNELS = [
  { channel: "#announcements", purpose: "Official event announcements, rule updates, schedule postings" },
  { channel: "#registration", purpose: "Registration links and submission confirmations" },
  { channel: "#schedule", purpose: "Match schedules and bracket postings" },
  { channel: "#check-in", purpose: "Pre-match team check-in" },
  { channel: "#match-results", purpose: "Result reporting by the winning team" },
  { channel: "#disputes", purpose: "Formal dispute submissions" },
  { channel: "#support", purpose: "General questions for Tournament Officials" },
  { channel: "#lobby-credentials", purpose: "Private lobby name and password distribution (restricted)" },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-20 text-center md:py-28">
        <ScrollReveal className="flex flex-col items-center gap-4">
          <span className="rounded-full border border-chaos-gold/40 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
            We answer fast
          </span>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-chaos-white md:text-6xl">
            Support
          </h1>
          <p className="max-w-2xl text-base text-chaos-white/70 md:text-lg">
            Registration, payments, match issues, disputes, and prize payouts. Support runs
            through the official Chaos Tournaments Discord server, where Tournament
            Officials handle every request.
          </p>
          <Link
            href="/login"
            className="touch-target mt-2 flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
          >
            Login with Discord
          </Link>
        </ScrollReveal>
      </section>

      {/* What we help with */}
      <section className="py-10 md:py-16">
        <ScrollReveal>
          <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            What we <span className="text-chaos-gold">help with</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal
          stagger
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TOPICS.map((topic) => (
            <Link
              key={topic.title}
              href={topic.href}
              className="group rounded-lg border border-white/10 bg-chaos-charcoal p-6 transition hover:border-chaos-gold/40"
            >
              <h3 className="font-display text-lg font-bold text-chaos-white transition group-hover:text-chaos-gold">
                {topic.title}
              </h3>
              <p className="mt-2 text-sm text-chaos-white/70">{topic.body}</p>
            </Link>
          ))}
        </ScrollReveal>
      </section>

      {/* How to get help */}
      <section className="py-10 md:py-16">
        <ScrollReveal>
          <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            How to get <span className="text-chaos-gold">help</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal
          stagger
          className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <div className="rounded-lg border border-white/10 bg-chaos-charcoal p-8">
            <h3 className="font-display text-xl font-bold text-chaos-white">Use the right channel</h3>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Every part of the operation has a home in the Discord server. Posting in the
              right place gets you the fastest answer.
            </p>
            <ul className="mt-6 space-y-3">
              {CHANNELS.map((c) => (
                <li key={c.channel} className="flex items-start gap-3">
                  <span className="rounded bg-chaos-black px-2 py-0.5 font-mono text-xs text-chaos-gold">
                    {c.channel}
                  </span>
                  <span className="text-sm text-chaos-white/70">{c.purpose}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-white/10 bg-chaos-charcoal p-8">
              <h3 className="font-display text-xl font-bold text-chaos-white">Match issues</h3>
              <ul className="mt-3 space-y-2 text-sm text-chaos-white/70">
                <li>
                  The winning team&apos;s representative reports the result in{" "}
                  <span className="font-mono text-xs text-chaos-gold">#match-results</span>{" "}
                  with team names, maps played, and final scores.
                </li>
                <li>Keep screenshots or recordings of your results until they are confirmed.</li>
                <li>
                  Disputes must be raised in{" "}
                  <span className="font-mono text-xs text-chaos-gold">#disputes</span> within
                  15 minutes of match completion. Results not disputed in that window are
                  final.
                </li>
                <li>
                  Need a Tournament Official? The Discord bot&apos;s{" "}
                  <span className="font-mono text-xs text-chaos-gold">/request-admin</span>{" "}
                  command routes requests straight to the right people.
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-white/10 bg-chaos-charcoal p-8">
              <h3 className="font-display text-xl font-bold text-chaos-white">Sanctions &amp; appeals</h3>
              <ul className="mt-3 space-y-2 text-sm text-chaos-white/70">
                <li>Sanctions are communicated to your Team Representative via Discord and/or email.</li>
                <li>
                  Appeals must be submitted within 48 hours of the sanction notification,
                  with the grounds for appeal and any supporting evidence.
                </li>
                <li>Management reviews appeals and issues a final decision within 5 business days.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-white/10 bg-chaos-charcoal p-8">
              <h3 className="font-display text-xl font-bold text-chaos-white">Prizes &amp; payouts</h3>
              <ul className="mt-3 space-y-2 text-sm text-chaos-white/70">
                <li>Payouts process through Stripe after tax documentation is complete.</li>
                <li>
                  Prize payment disputes must be submitted in writing within 30 days of the
                  scheduled payment date.
                </li>
                <li>All prize rules, windows, and requirements are in the rulebook.</li>
              </ul>
              <Link
                href="/rules#chapter-6"
                className="touch-target mt-5 inline-flex items-center justify-center rounded-md border border-chaos-gold/50 px-6 text-sm font-bold text-chaos-gold transition hover:bg-chaos-gold/10"
              >
                Read Prize Rules
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-20 text-center">
        <ScrollReveal className="flex flex-col items-center gap-4">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            Still <span className="text-chaos-gold">stuck?</span>
          </h2>
          <p className="max-w-lg text-sm text-chaos-white/70">
            Sign in with Discord and head to the support channel. If it&apos;s a competitive
            matter, the rulebook is the source of truth.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="touch-target flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
            >
              Login with Discord
            </Link>
            <Link
              href="/rules"
              className="touch-target flex items-center justify-center rounded-md border border-chaos-gold/50 px-8 text-base font-bold text-chaos-gold transition hover:bg-chaos-gold/10"
            >
              Read the Rulebook
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
