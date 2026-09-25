import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Grudge Matches",
  description:
    "Challenge any team or player on any platform. Fund the entry, settle it, and the payout follows the entry. PC vs console, 1v1 or team grudge matches at Chaos Tournaments.",
};

const STEPS = [
  {
    step: "01",
    title: "Send the challenge",
    body: "Challenge another team or a single player. They accept or decline through the official Discord server.",
  },
  {
    step: "02",
    title: "Fund the entries",
    body: "Every spot in a grudge match has an entry. Slots are funded before the match goes live — pay your own or have a supporter cover it.",
  },
  {
    step: "03",
    title: "Play the match",
    body: "Both sides agree on a time and the match is played under the official Chaos Tournaments rulebook.",
  },
  {
    step: "04",
    title: "Collect the payout",
    body: "Prizes follow the entry. Whoever funded the winning side owns the payout share that goes with it.",
  },
];

const FORMATS = [
  {
    title: "Team grudge match",
    body: "Every required starting-player position creates an entry slot. Any authorized user may fund one or more of those entries, and payout rights belong to the payer. All required entries on both sides must be funded before the match becomes active.",
  },
  {
    title: "1v1 grudge match",
    body: "Each competitor has a single entry slot. You can pay your own entry, or another authorized user can sponsor you. If a sponsored competitor wins, the payout entitlement belongs to the sponsor who funded the winning entry.",
  },
];

const STATUS_FLOW = [
  "Draft",
  "Challenge sent",
  "Accepted",
  "Awaiting entry funding",
  "Partially funded",
  "Fully funded",
  "Scheduled",
  "In progress",
  "Awaiting result",
  "Awaiting confirmation",
  "Completed",
];

const STATUS_TERMINAL = ["Declined", "Disputed", "Cancelled"];

export default function GrudgeMatchesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-20 text-center md:py-28">
        <ScrollReveal className="flex flex-col items-center gap-4">
          <span className="rounded-full border border-chaos-gold/40 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
            Outside the bracket
          </span>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-chaos-white md:text-6xl">
            Grudge <span className="text-chaos-gold">matches</span>
          </h1>
          <p className="max-w-2xl text-base text-chaos-white/70 md:text-lg">
            Settle the score. One team or one player, any platform, real stakes. A grudge
            match is a standalone challenge with funded entries and a payout that follows
            the entry.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="touch-target flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
            >
              Login with Discord
            </Link>
            <Link
              href="/teams"
              className="touch-target flex items-center justify-center rounded-md border border-chaos-gold/50 px-8 text-base font-bold text-chaos-gold transition hover:bg-chaos-gold/10"
            >
              Find a Team to Challenge
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* How it works */}
      <section className="py-10 md:py-16">
        <ScrollReveal>
          <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            How it <span className="text-chaos-gold">works</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal
          stagger
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((item) => (
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

      {/* Formats */}
      <section className="py-10 md:py-16">
        <ScrollReveal>
          <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            Two ways to <span className="text-chaos-gold">settle it</span>
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {FORMATS.map((format) => (
            <ScrollReveal
              key={format.title}
              className="rounded-lg border border-white/10 bg-chaos-charcoal p-8 transition hover:border-chaos-gold/40"
            >
              <h3 className="font-display text-xl font-bold text-chaos-white">
                {format.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
                {format.body}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Platform rules */}
      <section className="py-10 md:py-16">
        <ScrollReveal className="max-w-3xl rounded-lg border border-chaos-gold/40 bg-chaos-charcoal p-8">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white">
            No platform <span className="text-chaos-gold">restrictions</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
            Grudge matches are open cross-platform. Any platform can challenge any platform
            or team — PC included. PC versus console, PS5 versus Xbox, mixed teams: if you
            can find them, you can challenge them. This is the one place where the
            tournament division walls come down.
          </p>
        </ScrollReveal>
      </section>

      {/* Match lifecycle */}
      <section className="py-10 md:py-16">
        <ScrollReveal>
          <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            Match <span className="text-chaos-gold">lifecycle</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-chaos-white/70">
            Every grudge match follows the same funded-entry lifecycle, from challenge to
            payout.
          </p>
        </ScrollReveal>
        <ScrollReveal
          stagger
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {STATUS_FLOW.map((status, i) => (
            <span key={status} className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-chaos-charcoal px-4 py-1.5 text-xs font-medium text-chaos-white/80">
                {status}
              </span>
              {i < STATUS_FLOW.length - 1 && (
                <span className="text-chaos-gold/50" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </ScrollReveal>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs uppercase tracking-wide text-chaos-white/40">
            Can end at any point:
          </span>
          {STATUS_TERMINAL.map((status) => (
            <span
              key={status}
              className="rounded-full border border-chaos-gold/30 bg-chaos-black/60 px-4 py-1.5 text-xs font-medium text-chaos-gold/80"
            >
              {status}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-20 text-center">
        <ScrollReveal className="flex flex-col items-center gap-4">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
            Ready to <span className="text-chaos-gold">run it back?</span>
          </h2>
          <p className="max-w-lg text-sm text-chaos-white/70">
            Sign in with Discord and find a team that owes you one. Grudge matches play by
            the official rulebook — same standards, no bracket required.
          </p>
          <Link
            href="/login"
            className="touch-target mt-2 flex items-center justify-center rounded-md bg-chaos-gold px-8 text-base font-bold text-chaos-black transition hover:shadow-gold-glow"
          >
            Login with Discord
          </Link>
        </ScrollReveal>
      </section>
    </div>
  );
}
