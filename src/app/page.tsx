import LeaderboardTabs from "@/components/LeaderboardTabs";
import BottomNav from "@/components/BottomNav";
import { signInWithDiscord } from "@/app/auth/actions";

// ─── Shared primitives ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-red-600 text-xs font-black uppercase tracking-[0.3em] mb-3">
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tight mb-2"
      style={{ fontFamily: "var(--font-barlow)" }}
    >
      {children}
    </h2>
  );
}

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

// ─── 1. Hero ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      id="home"
      className="relative flex flex-col items-center justify-center min-h-svh px-4 pt-10 pb-24 text-center overflow-hidden"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>

      {/* Logo mark */}
      <div className="relative mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <h1
          className="text-6xl sm:text-8xl font-black uppercase leading-none tracking-tight"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          <span className="text-red-600">CHAOS</span>
          <br />
          <span className="text-white">TOURNAMENTS</span>
        </h1>
      </div>

      <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
        Lock in. Squad up. Win.
      </p>

      <p className="text-xl sm:text-2xl font-bold text-white max-w-sm mb-10 leading-tight">
        Stop Playing Ranked.{" "}
        <span className="text-red-500">Start Playing For Money.</span>
      </p>

      <form action={signInWithDiscord}>
        <button
          type="submit"
          className="group flex items-center gap-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black uppercase tracking-wider text-base px-8 py-4 rounded-xl shadow-lg shadow-red-600/30 transition-all hover:shadow-red-600/50 hover:scale-105"
        >
          <DiscordIcon size={22} />
          Join With Discord
        </button>
      </form>

      <p className="mt-4 text-gray-600 text-xs">
        Free to join. Pay only when you enter a tournament.
      </p>

      {/* Scroll indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}

// ─── 2. Why Chaos ────────────────────────────────────────────────────────────

const whyItems = [
  { icon: "💰", label: "Small buy-ins" },
  { icon: "🏆", label: "Big bragging rights" },
  { icon: "💵", label: "Cash prizes" },
  { icon: "🎮", label: "Organized competition" },
];

function WhyChaos() {
  return (
    <section className="px-4 py-16">
      <div className="max-w-xl mx-auto text-center">
        <SectionLabel>Why Chaos</SectionLabel>
        <SectionHeading>Put Your Money Where Your Mouth Is</SectionHeading>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          No more endless ranked queues with nothing on the line. Every match in
          Chaos Tournaments has real stakes — and real payouts.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {whyItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 border border-red-600/40 bg-red-600/5 text-white text-sm font-bold uppercase tracking-wider px-4 py-2.5 rounded-full"
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3. How It Works ─────────────────────────────────────────────────────────

const steps = [
  {
    num: "01",
    title: "Register Your Team",
    body: "Connect your Discord, invite your squad (2–5 players), and create your team profile.",
  },
  {
    num: "02",
    title: "Pay The Buy-In",
    body: "Secure checkout via Stripe. Weekly tournaments start at $10, monthly events at $25.",
  },
  {
    num: "03",
    title: "Win Games Get Paid",
    body: "Top 3 teams split the prize pool — 50%, 30%, 20%. Payouts hit the same day.",
  },
];

function HowItWorks() {
  return (
    <section className="px-4 py-16 bg-white/[0.02]">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>How It Works</SectionLabel>
          <SectionHeading>Simple. Fast. Paid.</SectionHeading>
        </div>

        <div className="flex flex-col gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex gap-5">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-red-600/40 to-transparent my-1 min-h-[48px]" />
                )}
              </div>

              {/* Content */}
              <div className="pb-10">
                <h3
                  className="text-xl font-black uppercase tracking-wide text-white mb-1"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 4. Upcoming Tournaments ─────────────────────────────────────────────────

const platforms = ["PC", "PS5", "Xbox"] as const;

const tournaments = [
  {
    name: "Weekly Chaos",
    cadence: "Every Sunday, 8 PM EST",
    priceRange: "$10 — $25",
    prizePool: "$200+",
    slots: "12 / 16",
    status: "OPEN",
    platforms,
    featured: false,
  },
  {
    name: "Monthly Chaos",
    cadence: "Last Saturday of month",
    priceRange: "$25 — $50",
    prizePool: "$800+",
    slots: "6 / 32",
    status: "OPEN",
    platforms,
    featured: true,
  },
];

function TournamentCard({
  name,
  cadence,
  priceRange,
  prizePool,
  slots,
  status,
  platforms: pls,
  featured,
}: (typeof tournaments)[0]) {
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden p-5 flex flex-col gap-4 ${
        featured
          ? "border-red-600/50 bg-red-600/5"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
          Featured
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`w-2 h-2 rounded-full ${status === "OPEN" ? "bg-green-500" : "bg-gray-500"}`}
          />
          <span className="text-green-500 text-[11px] font-black uppercase tracking-widest">
            {status}
          </span>
        </div>
        <h3
          className="text-2xl font-black uppercase tracking-wide text-white"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          {name}
        </h3>
        <p className="text-gray-500 text-xs mt-0.5">{cadence}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Buy-In</p>
          <p className="text-white font-black text-lg" style={{ fontFamily: "var(--font-barlow)" }}>
            {priceRange}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Prize Pool</p>
          <p className="text-red-500 font-black text-lg" style={{ fontFamily: "var(--font-barlow)" }}>
            {prizePool}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {pls.map((p) => (
            <span
              key={p}
              className="text-[10px] font-black uppercase tracking-wider border border-white/20 text-gray-300 px-2 py-0.5 rounded"
            >
              {p}
            </span>
          ))}
        </div>
        <span className="text-gray-500 text-xs font-bold">{slots} teams</span>
      </div>

      <button className="w-full bg-white text-black font-black uppercase tracking-widest text-sm py-3 rounded-xl hover:bg-red-600 hover:text-white transition-colors">
        Register Now →
      </button>
    </div>
  );
}

function TournamentsSection() {
  return (
    <section id="tournaments" className="px-4 py-16">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <SectionLabel>Upcoming Events</SectionLabel>
          <SectionHeading>Upcoming Tournaments</SectionHeading>
        </div>

        <div className="flex flex-col gap-4">
          {tournaments.map((t) => (
            <TournamentCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 5. Bracket Viewer ───────────────────────────────────────────────────────

const bracketData = {
  qf: [
    { t1: "CHAOS", s1: 2, t2: "VOID", s2: 0, done: true },
    { t1: "APEX", s1: 2, t2: "NOVA", s2: 1, done: true },
    { t1: "BLAZE", s1: 2, t2: "STORM", s2: 0, done: true },
    { t1: "ECHO", s1: 2, t2: "GRIND", s2: 1, done: true },
  ],
  sf: [
    { t1: "CHAOS", s1: 2, t2: "APEX", s2: 0, done: true },
    { t1: "BLAZE", s1: 1, t2: "ECHO", s2: 2, done: true },
  ],
  final: [{ t1: "CHAOS", s1: null, t2: "ECHO", s2: null, done: false }],
};

function MatchCard({
  t1, s1, t2, s2, done, winner,
}: {
  t1: string; s1: number | null; t2: string; s2: number | null; done: boolean; winner?: string;
}) {
  const w = done ? winner : null;
  return (
    <div className={`rounded-lg border overflow-hidden text-xs font-bold min-w-[130px] ${done ? "border-red-600/40" : "border-white/20"}`}>
      <div className={`flex items-center justify-between px-2.5 py-2 border-b border-white/10 ${w === t1 ? "text-white" : "text-gray-500"}`}>
        <span className="uppercase tracking-wide truncate mr-2">{t1}</span>
        <span className={`font-black ${w === t1 ? "text-red-500" : ""}`}>{s1 ?? "—"}</span>
      </div>
      <div className={`flex items-center justify-between px-2.5 py-2 ${w === t2 ? "text-white" : "text-gray-500"}`}>
        <span className="uppercase tracking-wide truncate mr-2">{t2}</span>
        <span className={`font-black ${w === t2 ? "text-red-500" : ""}`}>{s2 ?? "—"}</span>
      </div>
    </div>
  );
}

function BracketViewer() {
  return (
    <section id="bracket" className="px-4 py-16 bg-white/[0.02]">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <SectionLabel>Live Bracket</SectionLabel>
          <SectionHeading>Bracket Viewer</SectionHeading>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex gap-6 min-w-[520px]">
            {/* Quarterfinals */}
            <div className="flex flex-col gap-2 flex-shrink-0 w-[130px]">
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-1 text-center">
                QF
              </p>
              {bracketData.qf.map((m, i) => (
                <MatchCard
                  key={i}
                  t1={m.t1} s1={m.s1} t2={m.t2} s2={m.s2} done={m.done}
                  winner={m.s1! > m.s2! ? m.t1 : m.t2}
                />
              ))}
            </div>

            {/* Connector QF→SF */}
            <div className="flex flex-col justify-around py-6 flex-shrink-0 w-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div className="w-full border-t border-red-600/30" />
                </div>
              ))}
            </div>

            {/* Semifinals */}
            <div className="flex flex-col justify-around flex-shrink-0 w-[130px]">
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-1 text-center">
                SF
              </p>
              <div className="flex flex-col gap-2">
                {bracketData.sf.map((m, i) => (
                  <MatchCard
                    key={i}
                    t1={m.t1} s1={m.s1} t2={m.t2} s2={m.s2} done={m.done}
                    winner={m.s1! > m.s2! ? m.t1 : m.t2}
                  />
                ))}
              </div>
            </div>

            {/* Connector SF→Final */}
            <div className="flex items-center flex-shrink-0 w-4">
              <div className="w-full border-t border-red-600/30" />
            </div>

            {/* Final */}
            <div className="flex flex-col justify-center flex-shrink-0 w-[130px]">
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2 text-center">
                FINAL
              </p>
              {bracketData.final.map((m, i) => (
                <MatchCard
                  key={i}
                  t1={m.t1} s1={m.s1} t2={m.t2} s2={m.s2} done={m.done}
                />
              ))}
              <div className="mt-2 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 animate-pulse">
                  ● Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 6. Leaderboard ──────────────────────────────────────────────────────────

function LeaderboardSection() {
  return (
    <section id="leaderboard" className="px-4 py-16">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <SectionLabel>Season Standings</SectionLabel>
          <SectionHeading>Leaderboard</SectionHeading>
        </div>
        <LeaderboardTabs />
      </div>
    </section>
  );
}

// ─── 7. Prize Pool ───────────────────────────────────────────────────────────

const prizes = [
  { place: "1ST", pct: "50%", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", icon: "🥇" },
  { place: "2ND", pct: "30%", color: "text-gray-300", border: "border-gray-500/30", bg: "bg-gray-500/5", icon: "🥈" },
  { place: "3RD", pct: "20%", color: "text-amber-700", border: "border-amber-800/30", bg: "bg-amber-900/5", icon: "🥉" },
];

function PrizePool() {
  return (
    <section className="px-4 py-16 bg-white/[0.02]">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <SectionLabel>Payouts</SectionLabel>
          <SectionHeading>Prize Pool Split</SectionHeading>
          <p className="text-gray-400 text-sm mt-2">
            Top 3 teams split 100% of the prize pool. No house cut.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {prizes.map((p) => (
            <div
              key={p.place}
              className={`rounded-2xl border ${p.border} ${p.bg} p-4 flex flex-col items-center gap-2`}
            >
              <span className="text-3xl">{p.icon}</span>
              <span
                className={`text-xl font-black uppercase tracking-wider ${p.color}`}
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                {p.place}
              </span>
              <span
                className="text-4xl font-black text-white"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                {p.pct}
              </span>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider text-center">
                of prize pool
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Example: 16 teams × $25 buy-in = $400 pool → 1st gets $200, 2nd $120, 3rd $80
        </p>
      </div>
    </section>
  );
}

// ─── 8. Discord CTA ──────────────────────────────────────────────────────────

function DiscordCTA() {
  return (
    <section className="px-4 py-20">
      <div className="max-w-xl mx-auto text-center">
        <div className="relative rounded-3xl border border-red-600/20 bg-red-600/5 p-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[300px] h-[300px] rounded-full bg-red-600/10 blur-[80px]" />
          </div>
          <div className="relative">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/40">
                <DiscordIcon size={30} />
              </div>
            </div>
            <h2
              className="text-4xl font-black uppercase leading-tight mb-3"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              Join The Community
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
              Get matched, trash talk legally, and stay updated on upcoming tournaments. 500+ players already in.
            </p>
            <form action={signInWithDiscord}>
              <button
                type="submit"
                className="flex items-center gap-3 mx-auto bg-[#5865F2] hover:bg-[#4752c4] text-white font-black uppercase tracking-wider text-sm px-8 py-4 rounded-xl transition-colors shadow-lg shadow-[#5865F2]/30"
              >
                <DiscordIcon size={20} />
                Join Discord Server
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 9. Footer ───────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-8 pb-28">
      <div className="max-w-xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span
              className="text-white font-black uppercase text-sm tracking-wider"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              Chaos Tournaments
            </span>
          </div>

          <div className="flex gap-6 text-gray-600 text-xs font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-white transition-colors">Rules</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>

        <p className="text-gray-700 text-xs text-center mt-6">
          © {new Date().getFullYear()} Chaos Tournaments. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen text-white">
      <Hero />
      <WhyChaos />
      <HowItWorks />
      <TournamentsSection />
      <BracketViewer />
      <LeaderboardSection />
      <PrizePool />
      <DiscordCTA />
      <Footer />
      <BottomNav />
    </main>
  );
}
