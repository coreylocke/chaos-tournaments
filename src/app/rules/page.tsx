import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "The official Chaos Tournaments rulebook for Rainbow Six: Siege. Eligibility, match settings, conduct, sanctions, prize distribution, and more.",
};

function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="scroll-mt-24 font-display text-xl font-bold text-chaos-white md:text-2xl"
    >
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="mt-6 font-body text-sm font-bold uppercase tracking-wide text-chaos-gold">{children}</h4>;
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-chaos-white/70">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-chaos-gold/70" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-4 rounded-r-lg border-l-2 border-chaos-gold/60 bg-chaos-charcoal p-4 text-sm leading-relaxed text-chaos-white/70">
      {children}
    </aside>
  );
}

function RulesTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-3 pl-4 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Setting</th>
            <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-white/5 last:border-b-0">
              <td className="whitespace-nowrap py-2.5 pl-4 pr-4 font-medium text-chaos-white/90">
                {label}
              </td>
              <td className="py-2.5 pr-4 text-chaos-white/70">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const MATCH_SETTINGS: [string, string][] = [
  ["HUD Settings", "Pro League"],
  ["Game Mode", "Bomb"],
  ["Ban Phase", "Pro League"],
  ["Ban Timer", "20 seconds"],
  ["Number of Rounds", "12"],
  ["Attack/Defense Role Swap", "Round 6"],
  ["Overtime Rounds", "3 (or Infinite)"],
  ["Overtime Score Difference", "2"],
  ["Overtime Role Change", "Every 1 Round"],
  ["Objective Rotation Parameter", "2"],
  ["Objective Type for Rotation", "Rounds Played"],
  ["Pick Phase Timer", "15 seconds"],
  ["Operator HP", "100"],
  ["Friendly Fire Damage", "100"],
  ["Friendly Fire in Prep Phase", "Off"],
  ["Reverse Friendly Fire", "Off"],
  ["Injured HP Threshold", "20"],
  ["Sprint", "On"],
  ["Lean", "On"],
  ["Death Duration", "2 seconds"],
  ["Death Replay", "Off"],
  ["Tactical Timeout Requests Per Team", "1"],
  ["Allow Timeout Requests From", "Everyone"],
  ["Timeout Duration", "45 seconds"],
  ["Role Swap Timeout", "On"],
  ["Role Swap Timeout Duration", "120 seconds"],
  ["Plant Duration", "7 seconds"],
  ["Defuse Duration", "7 seconds"],
  ["Fuse Time", "45 seconds"],
  ["Defuser Carrier Selection", "On"],
  ["Preparation Phase Duration", "45 seconds"],
  ["Action Phase Duration", "180 seconds"],
];

const SANCTION_LEVELS: [string, string, string][] = [
  ["Cosmetic violation", "Warning", "Round loss"],
  ["Spawnkilling", "Round loss", "Map loss"],
  ["Prohibited exploit use", "Round loss", "Match forfeit"],
  ["Unsportsmanlike conduct", "Warning", "Temporary suspension"],
  ["Harassment / hate speech", "Temporary suspension", "Permanent ban"],
  ["Match fixing", "Permanent ban + prize forfeit", "Permanent ban + prize forfeit"],
  ["Cheating / third-party software", "Temporary suspension", "Permanent ban + prize forfeit"],
  ["Failure to cooperate with investigation", "Warning", "Maximum sanction for underlying offense"],
];

const DISCORD_CHANNELS: [string, string][] = [
  ["#announcements", "Official event announcements, rule updates, schedule postings"],
  ["#registration", "Registration links and submission confirmations"],
  ["#schedule", "Match schedules and bracket postings"],
  ["#check-in", "Pre-match team check-in"],
  ["#match-results", "Result reporting by winning team"],
  ["#disputes", "Formal dispute submissions"],
  ["#support", "General questions for Tournament Officials"],
  ["#lobby-credentials", "Private lobby name and password distribution (restricted)"],
];

const TOC = [
  { href: "#introduction", label: "Introduction" },
  { href: "#chapter-1", label: "Chapter 1 — Eligibility & Registration" },
  { href: "#chapter-2", label: "Chapter 2 — Game Rules & Match Settings" },
  { href: "#chapter-3", label: "Chapter 3 — Match Operations & Administration" },
  { href: "#chapter-4", label: "Chapter 4 — Conduct & Sportsmanship" },
  { href: "#chapter-5", label: "Chapter 5 — Sanctions & Penalties" },
  { href: "#chapter-6", label: "Chapter 6 — Prize Distribution" },
  { href: "#chapter-7", label: "Chapter 7 — Media, Broadcasting & Sponsorship" },
  { href: "#chapter-8", label: "Chapter 8 — Privacy & Data" },
  { href: "#chapter-9", label: "Chapter 9 — General Provisions" },
  { href: "#appendices", label: "Appendices" },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      {/* Header */}
      <section className="text-center">
        <span className="rounded-full border border-chaos-gold/40 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
          Official Rulebook · Version 1.0
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-tight text-chaos-white md:text-5xl">
          Chaos <span className="text-chaos-gold">Tournaments</span>
        </h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-chaos-white/50">
          Rainbow Six: Siege · Chaos Tournaments LLC
        </p>
      </section>

      {/* Table of contents */}
      <nav className="mt-12 rounded-lg border border-white/10 bg-chaos-charcoal p-6 md:p-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chaos-gold">
          Table of Contents
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
          {TOC.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-chaos-white/70 transition hover:text-chaos-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Introduction */}
      <section id="introduction" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Introduction
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-chaos-white/70">
          Chaos Tournaments is an independent esports organization operated by Chaos
          Tournaments LLC, committed to providing competitive, fair, and professional
          Rainbow Six: Siege tournament experiences for players and teams at all levels.
          This rulebook establishes the official standards, game rules, conduct
          expectations, and operational procedures that govern all competitions hosted or
          sanctioned by Chaos Tournaments LLC.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-chaos-white/70">
          The rules contained within this document are aligned with industry standards
          recognized across top-tier professional Rainbow Six: Siege competition, ensuring
          that participants competing in Chaos Tournaments events are operating under
          familiar, widely accepted competitive guidelines.
        </p>

        <SectionHeading id="core-values">Core Values</SectionHeading>
        <Bullets
          items={[
            <>
              <strong className="text-chaos-white">Integrity</strong> — Fair and transparent
              competition at all times.
            </>,
            <>
              <strong className="text-chaos-white">Consistency</strong> — Rules applied
              equally to every participant and team.
            </>,
            <>
              <strong className="text-chaos-white">Respect</strong> — Professional conduct
              expected from all parties.
            </>,
            <>
              <strong className="text-chaos-white">Accessibility</strong> — Open, competitive
              environment for teams at all skill levels.
            </>,
          ]}
        />

        <SectionHeading id="scope">Scope of this Rulebook</SectionHeading>
        <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
          This rulebook applies to all participants in any Chaos Tournaments event,
          including but not limited to:
        </p>
        <Bullets
          items={[
            "Competing Players",
            "Team Coaches and Managers",
            "Support Staff",
            "Tournament Officials and Administrative Staff",
          ]}
        />
        <p className="mt-4 text-sm leading-relaxed text-chaos-white/70">
          By registering for or participating in any Chaos Tournaments competition, all
          participants acknowledge that they have read, understood, and agree to be bound
          by the rules set forth in this document, as well as any event-specific rules
          communicated prior to competition.
        </p>
        <Note>
          Chaos Tournaments LLC reserves the right to amend or supplement these rules at
          any time. Participants will be notified of any material changes via the official
          Chaos Tournaments Discord server.
        </Note>
      </section>

      {/* Chapter 1 */}
      <section id="chapter-1" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 1 — <span className="text-chaos-gold">Eligibility &amp; Registration</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="1-1">1.1 Age Requirement</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All Players, Coaches, and Team Staff must be a minimum of 18 years of age at
              the time of their first official match in any Chaos Tournaments competition.
              Age is verified by official government-issued identification.
            </p>
            <Bullets
              items={[
                "Proof of age may be requested by Tournament Officials at any time prior to or during a competition.",
                "Any participant found to be under the age of 18 will be immediately ruled ineligible and their team may face forfeiture of applicable matches.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="1-2">1.2 Account Requirements</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All Players must maintain a Ubisoft account in good standing throughout the
              entirety of any Chaos Tournaments competition they participate in.
            </p>
            <Bullets
              items={[
                "A Ubisoft account is considered in good standing when it is free from active bans, suspensions, or violations under Ubisoft's Terms of Service and Rainbow Six: Siege Code of Conduct.",
                "Any active account ban or suspension issued by Ubisoft may result in the Player being deemed ineligible to compete.",
                "Players are responsible for maintaining the integrity of their own accounts at all times.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="1-3">1.3 No Active Competitive Suspensions</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              No Player, Coach, or Team Staff member may participate in a Chaos Tournaments
              competition if they are currently subject to a competitive suspension issued
              by:
            </p>
            <Bullets
              items={[
                "Chaos Tournaments LLC",
                "Ubisoft / BLAST R6",
                "Any other recognized esports governing body whose suspension Chaos Tournaments LLC chooses to honor",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC reserves the right to independently determine whether
              an external suspension warrants ineligibility on a case-by-case basis.
            </p>
          </div>

          <div>
            <SectionHeading id="1-4">1.4 Conflict of Interest</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All participants are required to disclose any potential conflicts of interest
              to Chaos Tournaments officials prior to competing. A conflict of interest
              includes, but is not limited to:
            </p>
            <Bullets
              items={[
                "Ownership of, or financial interest in, multiple teams competing in the same Chaos Tournaments event.",
                "Employment, contractor status, or agent relationship with Chaos Tournaments LLC, its partners, or its sponsors.",
                "Any situation in which a participant could directly benefit financially or otherwise from manipulating the outcome of a match.",
                "Any undisclosed agreement between participants that could influence match results or bracket outcomes.",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Failure to disclose a conflict of interest, or participation in a confirmed
              conflict of interest, may result in immediate disqualification and further
              sanctions as outlined in Chapter 5.
            </p>
          </div>

          <div>
            <SectionHeading id="1-5">1.5 Team Registration</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All teams must complete official registration through the Chaos Tournaments
              registration form (linked in the official Discord server and/or website)
              before competing in any event. Registration requires the following
              information to be submitted by the designated Team Representative.
            </p>

            <SubHeading>1.5.1 Required Registration Information</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each team must provide the following for all registered Players and Coaches:
            </p>
            <Bullets
              items={[
                "Legal first and last name",
                "Date of birth",
                "Ubisoft username and Ubisoft ID",
                "In-game name (IGN) to be used throughout the event",
                "Role (Starter, Substitute, or Coach)",
                "Country of residence",
                "Discord username (for match communications)",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each team must also provide the following organizational information:
            </p>
            <Bullets
              items={[
                "Official team name",
                "Team abbreviation or tag",
                "Name, contact email, and Discord username of the Team Representative",
              ]}
            />

            <SubHeading>1.5.2 Team Representative</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each registered team must designate one Team Representative who will serve as
              the official point of contact between the team and Chaos Tournaments LLC for
              all administrative, logistical, and competitive communications conducted
              through the official Discord server.
            </p>
            <Bullets
              items={[
                "The Team Representative may be a Player, Coach, or Manager — but only one person may hold this role per team.",
                "The Team Representative is responsible for ensuring all team members comply with registration requirements and rulebook obligations.",
                "The Team Representative must be a member of the official Chaos Tournaments Discord server and reachable through it for the duration of the event.",
                "Changes to the Team Representative must be submitted to Tournament Officials in writing via Discord prior to taking effect.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="1-6">1.6 Roster Composition</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each registered team roster must meet the following composition requirements.
            </p>

            <SubHeading>1.6.1 Minimum Roster</SubHeading>
            <Bullets
              items={[
                "Five (5) registered Starter Players are required for a team to be eligible to compete.",
                "A team that cannot field five eligible Starters at match time may be subject to forfeit as outlined in Section 3.8.",
              ]}
            />

            <SubHeading>1.6.2 Optional Roster Additions</SubHeading>
            <Bullets
              items={[
                "Up to two (2) Substitute Players may be registered per team.",
                "One (1) Coach may be registered per team.",
                "Additional Support Staff (analyst, manager, etc.) may be listed but are not required for registration.",
              ]}
            />

            <SubHeading>1.6.3 Maximum Roster Size</SubHeading>
            <Bullets
              items={[
                "The maximum number of registered Players per team is seven (7): five Starters and two Substitutes.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="1-7">1.7 Roster Lock</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All rosters are considered locked at the registration deadline for each event
              or stage of competition as communicated in the official Chaos Tournaments
              Discord server prior to that event.
            </p>
            <Bullets
              items={[
                "No new Players or Coaches may be added to a roster after the Roster Lock deadline.",
                "Player in-game names (IGNs) may not be changed after Roster Lock without prior approval from Tournament Officials.",
                "Unauthorized changes to a locked roster may result in penalties as described in Chapter 5.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="1-8">1.8 Stand-In Players</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              In the event a team cannot field five eligible Starters due to an unforeseen
              and documented emergency, a Stand-In Player may be permitted under the
              following conditions:
            </p>
            <Bullets
              items={[
                "The team must notify Tournament Officials via the official Discord server as soon as the issue is identified, and prior to the scheduled match time.",
                "The Stand-In Player must meet all eligibility requirements outlined in Sections 1.1 through 1.4.",
                "The Stand-In Player may not be a registered Player or Coach on any other team competing in the same event.",
                "Approval of a Stand-In Player is at the sole discretion of Tournament Officials.",
              ]}
            />
            <Note>
              Stand-In Players are a last resort measure only. Teams are expected to
              maintain their registered roster and plan accordingly. Repeated or suspicious
              Stand-In requests may be subject to review.
            </Note>
          </div>

          <div>
            <SectionHeading id="1-9">1.9 Player In-Game Names</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each Player must compete under their registered in-game name (IGN) for the
              duration of the event.
            </p>
            <Bullets
              items={[
                "IGN changes must be requested in writing to Tournament Officials via the official Discord server and approved before taking effect.",
                "IGNs must not contain offensive, discriminatory, or inappropriate language as determined by Chaos Tournaments LLC.",
                "Tournament Officials reserve the right to require a Player to change their IGN if it violates these standards.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Chapter 2 */}
      <section id="chapter-2" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 2 — <span className="text-chaos-gold">Game Rules &amp; Match Settings</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="2-1">2.1 Overview</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Rainbow Six: Siege is a 5v5 first-person tactical shooter in which two teams
              compete across multiple rounds by attacking and defending objectives on a
              variety of maps. All Chaos Tournaments competitions are played on PC unless
              explicitly stated otherwise in event-specific rules communicated via the
              official Chaos Tournaments Discord server.
            </p>
          </div>

          <div>
            <SectionHeading id="2-2">2.2 Match Formats</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A match may be played in one of the following formats, as designated in the
              event-specific rules posted in the Chaos Tournaments Discord prior to
              competition:
            </p>
            <Bullets
              items={[
                <>
                  <strong className="text-chaos-white">Best of 1 (BO1)</strong> — One map is
                  played. The team that wins that map wins the match.
                </>,
                <>
                  <strong className="text-chaos-white">Best of 3 (BO3)</strong> — Up to three
                  maps are played. The first team to win two maps wins the match.
                </>,
                <>
                  <strong className="text-chaos-white">Best of 5 (BO5)</strong> — Up to five
                  maps are played. The first team to win three maps wins the match.
                </>,
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The format for each stage of competition will be announced in the Chaos
              Tournaments Discord server no later than 48 hours before the start of that
              stage.
            </p>
          </div>

          <div>
            <SectionHeading id="2-3">2.3 Match Settings</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The following settings must be applied to all official Chaos Tournaments
              matches. It is the responsibility of the designated host to ensure these
              settings are configured correctly before the match begins.
            </p>
            <RulesTable rows={MATCH_SETTINGS} />
            <Note>
              The game must be hosted on a local server or custom lobby. Under no
              circumstances may a Player or Team Staff member serve as the host. Tournament
              Officials or an observer account designated by Chaos Tournaments LLC will
              host all official matches.
            </Note>
          </div>

          <div>
            <SectionHeading id="2-4">2.4 Map Pool</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The official Chaos Tournaments competitive map pool consists of the following
              9 maps:
            </p>
            <Bullets
              items={[
                "Bank",
                "Border",
                "Chalet",
                "Clubhouse",
                "Consulate",
                "Kafe Dostoyevsky",
                "Lair",
                "Nighthaven Labs",
                "Fortress",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Map pool updates will be announced in the Chaos Tournaments Discord server
              with a minimum of two weeks notice before any change takes effect for
              official competition.
            </p>
          </div>

          <div>
            <SectionHeading id="2-5">2.5 Map Ban Sequence</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All matches begin with a map ban sequence. The team labeled &quot;Team A&quot;
              and &quot;Team B&quot; will be assigned by Tournament Officials and
              communicated in the Chaos Tournaments Discord match channel prior to the
              start of the ban sequence.
            </p>

            <SubHeading>2.5.1 Best of 1 Map Ban Sequence</SubHeading>
            <Bullets
              items={[
                "A coin toss determines which team bans first. The winner of the coin toss chooses to ban first or second.",
                "Sequence: A Ban – B Ban – A Ban – B Ban – A Ban – B Ban – A Ban – B Pick",
                "The team that did not pick the map receives Side Selection.",
              ]}
            />

            <SubHeading>2.5.2 Best of 3 Map Ban Sequence</SubHeading>
            <Bullets
              items={[
                "A coin toss determines which team bans first.",
                "Sequence: A Ban – B Ban – A Ban – B Ban – A Pick – B Pick – A Ban – B Ban – Decider",
                "The team with the highest series round differential receives Side Selection on the Decider map. In the event of a tie, a coin flip determines Side Selection.",
                "The team that did not pick a map receives Side Selection on that map.",
              ]}
            />

            <SubHeading>2.5.3 Best of 5 Map Ban Sequence</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              <strong className="text-chaos-white">Single Elimination format:</strong>
            </p>
            <Bullets
              items={[
                "A coin toss determines which team bans first.",
                "Sequence: A Ban – B Ban – A Pick – B Pick – A Ban – B Ban – A Pick – B Pick – Decider",
                "The team with the highest series round differential receives Side Selection on the Decider.",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              <strong className="text-chaos-white">Double Elimination format:</strong>
            </p>
            <Bullets
              items={[
                "The upper bracket team receives Side Selection on the Decider map.",
                "Sequence: UB Pick / LB Ban / UB Ban / LB Pick / UB Ban / LB Ban / UB Pick / LB Pick / Decider",
              ]}
            />

            <SubHeading>2.5.4 Overtime Side Selection</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Should any map reach overtime, the team that did not receive original Side
              Selection on that map will receive Overtime Side Selection.
            </p>
          </div>

          <div>
            <SectionHeading id="2-6">2.6 Operator Ban System</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The operator ban system for all Chaos Tournaments competitions operates as
              follows:
            </p>
            <SubHeading>Before Round 1</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Both teams simultaneously ban one operator from the opposing side (attackers
              ban a defender, defenders ban an attacker), twice. This results in 4 total
              operators banned. Coaches are permitted to communicate with players during
              this ban phase.
            </p>
            <SubHeading>Before Round 4</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each team receives one additional ban, bringing the total number of banned
              operators to 6. Coaches are not permitted to communicate with players during
              this ban phase.
            </p>
            <SubHeading>Before Round 7 (Side Swap)</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All operator bans are reset. Teams swap sides. The ban sequence from before
              Round 1 repeats, resulting in 4 operators banned again. Coaches are permitted
              to communicate with players during this ban phase.
            </p>
            <SubHeading>Before Round 10</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The Round 4 ban sequence repeats, bringing the total to 6 banned operators
              once again. Coaches are not permitted to communicate with players during this
              ban phase.
            </p>
            <SubHeading>Overtime</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              No new operator bans are issued during overtime. The game automatically
              replicates the 3 bans each team had for their respective side during
              regulation. 6 operators remain banned at all times during overtime. Coaches
              may not communicate with players during the automated overtime ban phase.
            </p>
            <Note>
              All ban timers are set to 20 seconds. If both teams lock in their bans before
              the timer expires, the timer will automatically shorten.
            </Note>
          </div>

          <div>
            <SectionHeading id="2-7">2.7 Tactical Timeouts</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Each team is permitted one (1) Tactical Timeout per map during any given
              match.
            </p>
            <Bullets
              items={[
                "To request a Tactical Timeout, the Coach must notify the Tournament Official or match administrator at the end of a round or at the very start of the operator pick phase of the following round.",
                "Upon notification, the game will be paused and a 45-second timer will begin. During this time, the Coach may communicate with their Players freely.",
                "Tournament Officials will monitor all coach-to-player communications during Tactical Timeouts.",
                "Once the 45 seconds have elapsed, coach communication will be cut off and the game will resume.",
                "When one team calls a Tactical Timeout, the opposing team's Coach is also permitted to communicate with their Players for the same duration.",
                "Unused Tactical Timeouts do not carry over to the next map.",
                "Tactical Timeouts requested before Round 4 or Round 6 will begin after the Operator Ban phase concludes.",
                "Players and Coaches may not leave the competition area during a Tactical Timeout without express approval from a Tournament Official.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="2-8">2.8 Role Swap Timeout</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A Role Swap Timeout is automatically triggered at the end of Round 6,
              immediately before attackers and defenders swap sides.
            </p>
            <Bullets
              items={[
                "Duration: 120 seconds.",
                "Coaches are permitted to communicate with Players during the Role Swap Timeout.",
                "Tournament Officials will monitor all communications during this period.",
                "Once the 120 seconds elapse, communication is cut off and the side swap proceeds.",
                "Players and Coaches may not leave the competition area during a Role Swap Timeout without express approval from a Tournament Official.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="2-9">2.9 Cosmetics</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              During all official Chaos Tournaments matches, Players may only use the
              following cosmetics:
            </p>
            <SubHeading>Permitted:</SubHeading>
            <Bullets
              items={[
                "Operator default skins",
                "Pro League / R6 Share team-branded cosmetics",
                "Six Major branded cosmetics",
                "Official esports program cosmetics (excluding the Thermite Legacy Set uniform and headgear, which are banned)",
              ]}
            />
            <SubHeading>Banned:</SubHeading>
            <Bullets
              items={[
                "All other battle dress uniforms and headgear not listed above",
                "All drone skins (default only permitted)",
                "All operator gadget skins (default only permitted)",
              ]}
            />
            <SubHeading>Penalties for cosmetic violations:</SubHeading>
            <Bullets
              items={[
                "First offense: Warning issued by Tournament Official",
                "Each subsequent offense: Round loss",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Weapon skins, weapon charms, and operator background cards are not subject to
              any cosmetic restrictions.
            </p>
            <Note>
              Chaos Tournaments LLC reserves the right to update the permitted cosmetics
              list at any time. Updates will be communicated via the official Discord
              server.
            </Note>
          </div>

          <div>
            <SectionHeading id="2-10">2.10 Operators, Gadgets, and Attachments</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All operators released in Rainbow Six: Siege are eligible for competitive
              play in Chaos Tournaments events upon their official release unless
              explicitly banned.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC reserves the right to ban specific operators, gadgets,
              equipment, or attachments at any time if they are found to contain bugs,
              create game-breaking imbalances, or otherwise compromise competitive
              integrity. Any such bans will be announced in the Chaos Tournaments Discord
              server.
            </p>
          </div>

          <div>
            <SectionHeading id="2-11">2.11 Prohibited Exploits &amp; Bug Abuse</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The following are known exploits that are strictly prohibited in all Chaos
              Tournaments competitions. Use of any prohibited exploit will result in at
              minimum an immediate round loss and may result in further sanctions under
              Chapter 5.
            </p>
            <SubHeading>Prohibited exploits include:</SubHeading>
            <Bullets
              items={[
                "Any position that allows a Player's operator, drone, or gadget to pass through any wall, object, or surface in a manner not intended by the game, resulting in the operator, drone, or gadget being hidden from normal view.",
                "Any position reachable only through teammate clustering via 3D model collisions (boosting through geometry).",
                "Any behavior that allows a Player to see or shoot an opponent without that opponent being able to see or return fire under normal conditions.",
                "Standing on a window ledge in an undetected position.",
                "Blocking window vaulting with a destructible shield.",
                "Shield boosting onto an undetected window ledge.",
                "Using a Mira Black Mirror to boost a player.",
                "Placing a Maestro Evil Eye on an Alibi decoy.",
                "Shooting through surfaces intended to be non-destructible, including walls, floors, ceilings, and other objects.",
                "Placing equipment or gadgets in locations where they cannot be destroyed.",
                "Vaulting onto skylight windows.",
                "Vigil boosting that renders Vigil undetectable.",
                "Vaulting on ledges and proning to reach normally inaccessible positions.",
              ]}
            />
            <SubHeading>Approved unintended mechanics (permitted for use):</SubHeading>
            <Bullets
              items={[
                "Using equipment or defusing through a destructible surface.",
                "Destroying a hatch with the defuser on it to cause it to fall and deactivate (results in a defender win).",
                "Smoking through walls.",
                "Hibana pellets, Ace SELMA charges, and Thermite exothermic charges being placed on non-standard surfaces.",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Any exploit not listed above should be reported immediately to a Tournament
              Official via the Chaos Tournaments Discord server. Chaos Tournaments LLC will
              evaluate and issue a ruling before that exploit may be used in competition.
            </p>
          </div>

          <div>
            <SectionHeading id="2-12">2.12 Tie Breaker Rules</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              When ties occur within a competition stage, they are broken using the
              following criteria applied sequentially:
            </p>
            <SubHeading>In a Best of 1 context:</SubHeading>
            <Bullets
              items={[
                "1. Round difference",
                "2. Head-to-head record",
                "3. Match win percentage",
                "4. Round win percentage",
                "5. Tiebreaker match",
              ]}
            />
            <SubHeading>In a Best of 3 or Best of 5 context:</SubHeading>
            <Bullets
              items={[
                "1. Map difference",
                "2. Round difference",
                "3. Head-to-head record",
                "4. Match win percentage",
                "5. Round win percentage",
                "6. Tiebreaker match",
              ]}
            />
            <Note>
              If a team is awarded a 7-0 match victory due to an opposing team&apos;s forfeit,
              that 7-0 scoreline will not be factored into tiebreaker calculations.
            </Note>
          </div>
        </div>
      </section>

      {/* Chapter 3 */}
      <section id="chapter-3" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 3 — <span className="text-chaos-gold">Match Operations &amp; Administration</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="3-1">3.1 Match Scheduling &amp; Communication</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All match scheduling, opponent communication, and result reporting for Chaos
              Tournaments events will be conducted through the official Chaos Tournaments
              Discord server unless otherwise stated in event-specific rules.
            </p>
            <Bullets
              items={[
                "Match schedules will be posted in the designated schedule channel in the Chaos Tournaments Discord.",
                "Teams are responsible for monitoring the Discord server for schedule updates, bracket postings, and any official announcements.",
                "Failure to monitor the Discord server and missing a scheduled match as a result does not constitute grounds for a reschedule.",
                "Teams must check in through the designated Discord check-in channel or process within the time window communicated by Tournament Officials for each event. Failure to check in on time may result in forfeiture.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="3-2">3.2 Match Check-In</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Prior to each match, both teams must complete a check-in process as directed
              by Tournament Officials in the Chaos Tournaments Discord.
            </p>
            <Bullets
              items={[
                "Check-in windows will be communicated in the Discord server before each event and each round of play.",
                "Teams that fail to complete check-in within the designated window may be subject to a forfeit loss at the discretion of Tournament Officials.",
                "Check-in confirms the team's active roster for that match, including any substitutions.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="3-3">3.3 Match Lobby Setup</SectionHeading>
            <Bullets
              items={[
                "Tournament Officials will designate the match host. Players and Team Staff may not host official match lobbies.",
                "Lobby credentials (room name and password) will be shared privately between Tournament Officials and Team Representatives via the Chaos Tournaments Discord.",
                "All Players must be present and ready in the lobby no later than the scheduled match start time.",
                "Teams are given a grace period of ten (10) minutes past the scheduled start time before a forfeit may be issued at Tournament Official discretion.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="3-4">3.4 Player Substitutions</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A team may substitute one or both of its registered Substitute Players into a
              match in place of a Starter.
            </p>
            <Bullets
              items={[
                "Substitution requests must be submitted to the Tournament Official managing the match via Discord no later than 60 minutes before a BO1 match or before the first map of a BO3 or BO5 series.",
                "The request must specify which Starter is being replaced and which Substitute is coming in.",
                "Tournament Officials will notify both teams of confirmed substitutions simultaneously, no later than 15 minutes before match start.",
                "No additional substitution requests may be made after official notification is sent.",
                "If a Starter is unable to play due to a sudden emergency with no available Substitute, the team's Coach may request to step in as a Player, subject to Tournament Official approval and full compliance with all eligibility requirements in Chapter 1.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="3-5">3.5 Technical Pauses</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A Technical Pause is a pause in match play initiated by Tournament Officials
              due to a technical issue preventing fair play. Technical Pauses are issued at
              the sole discretion of Tournament Officials.
            </p>
            <Bullets
              items={[
                "There is no pre-set time limit for Technical Pauses.",
                "Once the action phase of a round begins, Players must make every effort to continue playing unless a Technical Pause is formally called by a Tournament Official.",
                "During a Technical Pause, Players and Coaches may only communicate with their assigned Tournament Official regarding the technical issue at hand.",
                "Players and Coaches may not leave the competition area during a Technical Pause without express approval from a Tournament Official.",
                "If both a Technical Pause and a Tactical Timeout are triggered for the same event, the Technical Pause takes priority. The Tactical Timeout will be issued after the technical issue is resolved.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="3-6">3.6 Re-Host</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Tournament Officials reserve the right to call for a full match re-host at any
              time if it is deemed necessary to preserve competitive integrity. Re-hosts
              are considered a form of Technical Pause.
            </p>
          </div>

          <div>
            <SectionHeading id="3-7">3.7 Result Reporting</SectionHeading>
            <Bullets
              items={[
                "Upon completion of each match, the winning team's Team Representative is responsible for reporting the result in the designated results channel in the Chaos Tournaments Discord.",
                "Result reports must include: team names, map(s) played, and final score(s).",
                "Screenshot or screen recording evidence of match results may be required by Tournament Officials and should be retained by both teams until results are officially confirmed.",
                "Disputed results must be raised in the Discord dispute channel within 15 minutes of match completion. Results not disputed within that window will be considered final.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="3-8">3.8 Forfeits</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A team may be issued a forfeit loss under the following circumstances:
            </p>
            <Bullets
              items={[
                "Failure to check in within the designated check-in window.",
                "Failure to have five eligible Players present and ready in the match lobby within the 10-minute grace period after scheduled start time.",
                "Disqualification due to eligibility violations discovered at or before match time.",
                "Refusal to play or abandonment of a match in progress without Tournament Official approval.",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A team issued a forfeit loss will receive a score of 0-7 on the forfeited map
              or match for record-keeping purposes, which will not be used in tiebreaker
              calculations per Section 2.12.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 4 */}
      <section id="chapter-4" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 4 — <span className="text-chaos-gold">Conduct &amp; Sportsmanship</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="4-1">4.1 General Conduct Standards</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All participants in Chaos Tournaments events — including Players, Coaches,
              Team Staff, and spectators — are expected to conduct themselves in a
              professional, respectful, and sportsmanlike manner at all times. This
              standard applies across all platforms and interactions associated with Chaos
              Tournaments, including but not limited to:
            </p>
            <Bullets
              items={[
                "The Chaos Tournaments Discord server",
                "In-game chat and voice communication",
                "Social media platforms (Twitter/X, TikTok, Instagram, YouTube, Twitch, etc.)",
                "Any live event or LAN environment hosted by Chaos Tournaments LLC",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="4-2">4.2 Prohibited Conduct</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The following conduct is strictly prohibited and may result in sanctions as
              outlined in Chapter 5.
            </p>

            <SubHeading>4.2.1 Cheating</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Cheating is defined as any in-game or out-of-game technique that provides an
              unfair competitive advantage. This includes but is not limited to:
            </p>
            <Bullets
              items={[
                "Use of third-party software that alters or exploits gameplay mechanics.",
                "Tampering with game files, servers, or client code.",
                "Stream sniping — gathering real-time match information from a broadcast while actively competing in that match.",
                "Use of any hardware modification designed to provide an unfair advantage.",
              ]}
            />

            <SubHeading>4.2.2 Match Fixing</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Match fixing is defined as any deliberate attempt to pre-determine,
              manipulate, or influence the outcome of a match or in-game events. This
              includes:
            </p>
            <Bullets
              items={[
                "Bribery or coercion of any participant.",
                "Intentional match throwing or sandbagging.",
                "Deliberate manipulation of brackets, seeds, or standings.",
                "Any undisclosed agreement between opposing teams or players that affects match outcomes.",
              ]}
            />

            <SubHeading>4.2.3 Unsportsmanlike Play</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Players and teams are expected to compete at their best at all times. The
              following are prohibited:
            </p>
            <Bullets
              items={[
                "Intentionally forfeiting rounds or maps to manipulate standings or avoid opponents.",
                "Intentional teamkilling.",
                "Spawnkilling — defined as killing an opponent within the first 2 seconds of the action phase of a round. Each confirmed spawnkill incident will result in a penalty issued by Tournament Officials.",
                "Stalling or deliberately slowing match proceedings without valid cause.",
              ]}
            />

            <SubHeading>4.2.4 Disrespectful Behavior</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The following behaviors will not be tolerated under any circumstances:
            </p>
            <Bullets
              items={[
                "Verbal abuse, harassment, or threats directed at any Player, Team Staff member, Tournament Official, or Chaos Tournaments LLC staff member.",
                "Use of slurs, discriminatory language, or hate speech of any kind — including language targeting race, ethnicity, nationality, gender identity, sexual orientation, religion, disability, age, or physical appearance.",
                "Excessive profanity or inflammatory language in public-facing channels including Discord, in-game chat, or social media.",
                "Impersonation of Tournament Officials, Chaos Tournaments LLC staff, or any other participant.",
                "Deliberate intimidation, threats of physical harm, or harassment of any individual.",
                "Stalking, unwanted contact, or conduct of a sexual nature directed at any participant.",
              ]}
            />

            <SubHeading>4.2.5 Gambling</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              No Player or Team Staff member may participate in betting or wagering —
              including fantasy esports — on the outcome of any Chaos Tournaments match or
              event.
            </p>
          </div>

          <div>
            <SectionHeading id="4-3">4.3 Discord-Specific Conduct</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The Chaos Tournaments Discord server is the primary communication hub for all
              events. All participants are expected to follow the server rules posted in
              the Discord at all times. Additional standards that apply within the Discord
              include:
            </p>
            <Bullets
              items={[
                "All communications with Tournament Officials must be kept professional and respectful.",
                "Disputes must be raised only in designated dispute channels and not in general or match channels.",
                "Spamming, trolling, or deliberately disrupting official communications channels may result in sanctions.",
                "Sharing of match credentials (lobby name/password) outside of authorized channels is prohibited and may result in match invalidation.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="4-4">4.4 Social Media &amp; Public Statements</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Participants are reminded that their public conduct reflects on Chaos
              Tournaments LLC. The following standards apply to all public-facing
              communications:
            </p>
            <Bullets
              items={[
                "Participants may not make public statements that are defamatory, threatening, or harassing toward any individual or organization.",
                "Participants may not publicly disclose confidential match or operational information shared by Chaos Tournaments LLC without prior written permission.",
                "Negative or inflammatory public commentary directed at Chaos Tournaments LLC, its staff, sponsors, or partners may result in sanctions.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Chapter 5 */}
      <section id="chapter-5" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 5 — <span className="text-chaos-gold">Sanctions &amp; Penalties</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="5-1">5.1 Overview</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Any violation of the rules contained in this rulebook — including the General
              Conduct Standards in Chapter 4, Game Rules in Chapter 2, and Eligibility
              Requirements in Chapter 1 — may result in competitive sanctions issued by
              Chaos Tournaments LLC. Sanctions may be applied to individual Players,
              Coaches, Team Staff, or to a team as a whole depending on the nature of the
              violation.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All sanctions are determined at the discretion of Chaos Tournaments LLC
              Tournament Officials and management, with consideration for severity, context,
              and history of prior violations.
            </p>
          </div>

          <div>
            <SectionHeading id="5-2">5.2 Types of Sanctions</SectionHeading>

            <SubHeading>5.2.1 Competitive Warning</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A formal warning issued to a Player, team, or staff member. Warnings are
              logged internally and may be referenced in future sanction decisions. A
              warning is the minimum disciplinary action and may precede more serious
              sanctions for repeat offenses.
            </p>

            <SubHeading>5.2.2 Round Loss</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A round is forfeited and awarded to the opposing team. Applied for in-match
              violations such as cosmetic infractions, spawnkilling, or prohibited exploit
              usage.
            </p>

            <SubHeading>5.2.3 Map Loss</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              An entire map is forfeited and awarded to the opposing team. Applied for more
              serious or repeated in-match violations.
            </p>

            <SubHeading>5.2.4 Match Forfeit</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              The entire match is forfeited and awarded to the opposing team. Applied for
              severe violations, failure to appear, or disqualifying eligibility issues
              discovered at match time.
            </p>

            <SubHeading>5.2.5 Temporary Suspension</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A Player, Coach, or Team Staff member is barred from participating in Chaos
              Tournaments events for a defined period of time. The duration will be
              determined based on the severity of the violation. Suspended individuals may
              not participate in any capacity — including coaching or administrative roles
              — during their suspension period.
            </p>

            <SubHeading>5.2.6 Permanent Ban</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A Player, Coach, or Team Staff member is permanently barred from all Chaos
              Tournaments events. Reserved for the most severe violations including
              confirmed cheating, match fixing, or repeated major conduct violations.
            </p>

            <SubHeading>5.2.7 Prize Forfeiture</SubHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Prize winnings may be withheld or forfeited in cases where a team or
              individual is found to have violated the rules in a manner that affected
              their competitive placement or prize eligibility. Prize forfeiture may be
              applied in conjunction with any other sanction.
            </p>
          </div>

          <div>
            <SectionHeading id="5-3">5.3 Sanction Notification</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All sanctions will be communicated to the affected party&apos;s Team
              Representative via the Chaos Tournaments Discord server (direct message or
              official channel) and/or via email on file from the registration form.
            </p>
            <Bullets
              items={[
                "The notification will include the nature of the violation, the sanction applied, and any right to appeal.",
                "In-match sanctions (round loss, map loss) may be issued immediately by the presiding Tournament Official without prior notice.",
                "All other sanctions will be issued following a review by Chaos Tournaments LLC management.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="5-4">5.4 Investigation Process</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Upon receipt of a report of a potential rules violation, Chaos Tournaments
              LLC may open a formal investigation.
            </p>
            <Bullets
              items={[
                "The reporting party should submit all relevant evidence (screenshots, video clips, match IDs, Discord logs, etc.) to Tournament Officials via the designated dispute or report channel in the Chaos Tournaments Discord.",
                "Chaos Tournaments LLC will make reasonable efforts to notify the party under investigation within 5 business days of opening an investigation.",
                "The party under investigation will have 5 business days to provide a response or any supporting evidence.",
                "Chaos Tournaments LLC reserves the right to extend investigation timelines for complex cases.",
                "All parties involved in an investigation are required to cooperate fully. Failure to cooperate, tampering with evidence, or attempting to obstruct an investigation may result in maximum available sanctions being applied.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="5-5">5.5 Duty to Cooperate</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All Players, Coaches, and Team Staff are required to cooperate fully with any
              investigation conducted by Chaos Tournaments LLC. This includes:
            </p>
            <Bullets
              items={[
                "Responding to requests for information within the timeframe provided.",
                "Providing truthful and complete information.",
                "Preserving and submitting any requested evidence.",
                "Refraining from influencing, intimidating, or contacting other parties involved in the investigation.",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Failure to cooperate will be treated as an independent violation and may
              result in sanctions separate from those related to the underlying
              investigation.
            </p>
          </div>

          <div>
            <SectionHeading id="5-6">5.6 Appeals</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Participants who wish to appeal a sanction may do so by submitting a written
              appeal to Chaos Tournaments LLC management via the official contact method
              communicated in the Discord server.
            </p>
            <Bullets
              items={[
                "Appeals must be submitted within 48 hours of receiving the sanction notification.",
                "Appeals must include the specific grounds for appeal and any supporting evidence not previously considered.",
                "Chaos Tournaments LLC management will review the appeal and issue a final decision within 5 business days.",
                "The decision issued on appeal is final and binding.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="5-7">5.7 Statute of Limitations</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC will not investigate or issue sanctions for any
              violation reported more than 12 months after the alleged incident occurred,
              unless the violation involved match fixing, cheating, or conduct of a
              criminal nature.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 6 */}
      <section id="chapter-6" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 6 — <span className="text-chaos-gold">Prize Distribution</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="6-1">6.1 Overview</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC is solely responsible for the collection and
              distribution of all prize funds for events it operates. No third party is
              authorized to collect or distribute prize money on behalf of Chaos
              Tournaments LLC. All prize payouts are processed through Chaos Tournaments
              LLC&apos;s designated payment processor,{" "}
              <strong className="text-chaos-white">Stripe</strong>.
            </p>
          </div>

          <div>
            <SectionHeading id="6-2">6.2 Prize Pool Announcement</SectionHeading>
            <Bullets
              items={[
                "The prize pool for each event will be announced in the Chaos Tournaments Discord server and/or on the official Chaos Tournaments registration form or website prior to the start of registration.",
                "Prize pool breakdowns by placement will be included in the event announcement.",
                "Chaos Tournaments LLC reserves the right to adjust prize pool amounts prior to the start of an event if circumstances require. Any adjustments will be communicated immediately via Discord.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="6-3">6.3 Eligibility to Receive Prize Winnings</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              To be eligible to receive prize winnings, a team and all of its competing
              members must:
            </p>
            <Bullets
              items={[
                "Have complied with all rules set forth in this rulebook throughout the event.",
                "Not be subject to an active prize forfeiture sanction under Chapter 5.",
                "Complete all required tax documentation prior to payment being released (see Section 6.5).",
                "Provide valid payment information through the Stripe payment process (see Section 6.6).",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC reserves the right to withhold prize payment from any
              individual or team found to have violated the rules in a manner that affected
              their competitive placement, pending the outcome of any investigation.
            </p>
          </div>

          <div>
            <SectionHeading id="6-4">6.4 Prize Distribution to Teams</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Where a prize is awarded to a team rather than an individual, the full prize
              amount will be paid to the Team Representative on record at the time of the
              event unless an alternative arrangement is submitted in writing to Chaos
              Tournaments LLC prior to the event concluding.
            </p>
            <Bullets
              items={[
                "It is the sole responsibility of the Team Representative to distribute prize funds among team members according to whatever internal agreement exists within the team.",
                "Chaos Tournaments LLC is not responsible for any disputes arising between team members regarding the internal distribution of prize funds.",
                "Chaos Tournaments LLC strongly recommends that all teams establish and document a prize split agreement among members prior to competing.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="6-5">6.5 Tax Documentation Requirements</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All prize winners are required to submit the applicable tax documentation
              before any prize payment will be released. This is a legal requirement and
              non-negotiable.
            </p>

            <SubHeading>6.5.1 United States Recipients</SubHeading>
            <Bullets
              items={[
                "Winners who are U.S. persons (citizens, residents, or U.S.-based entities) must submit a completed IRS Form W-9 prior to payment.",
                "W-9 forms will be sent to the Team Representative's email on file via a secure link following the conclusion of the event.",
              ]}
            />

            <SubHeading>6.5.2 International Recipients</SubHeading>
            <Bullets
              items={[
                "Winners outside the United States must submit a completed IRS Form W-8BEN (individuals) or W-8BEN-E (entities) prior to payment.",
                "These forms establish foreign status and may affect applicable withholding tax rates.",
              ]}
            />

            <SubHeading>6.5.3 Submission Deadline</SubHeading>
            <Bullets
              items={[
                "All required tax documentation must be submitted within 14 calendar days of the prize notification being sent to the Team Representative.",
                "Failure to submit required documentation within 14 days will result in the prize being forfeited unless an extension is granted in writing by Chaos Tournaments LLC management.",
              ]}
            />

            <SubHeading>6.5.4 Tax Responsibility</SubHeading>
            <Bullets
              items={[
                "Winners are solely responsible for reporting and paying any applicable federal, state, local, or international taxes on prize winnings.",
                "Chaos Tournaments LLC is not responsible for providing tax advice. Winners are encouraged to consult a qualified tax professional.",
                "Chaos Tournaments LLC will issue a 1099-NEC (or equivalent) to applicable U.S.-based winners as required by law.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="6-6">6.6 Payment Process via Stripe</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All prize payments are processed through{" "}
              <strong className="text-chaos-white">Stripe</strong>, Chaos Tournaments
              LLC&apos;s official payment platform.
            </p>
            <Bullets
              items={[
                "Following confirmation of tax documentation, the Team Representative will receive a secure Stripe payment link via the email address on file from registration.",
                "The Team Representative must complete the Stripe onboarding or payment acceptance process within 7 calendar days of receiving the payment link.",
                "Failure to complete the payment acceptance process within 7 days may result in forfeiture of the prize unless an extension is granted by Chaos Tournaments LLC management in writing.",
                "Stripe's standard processing times apply. Chaos Tournaments LLC is not responsible for delays caused by Stripe's platform, banking processing times, or incorrect payment information submitted by the recipient.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="6-7">6.7 Payment Timeline</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Subject to receipt of all required tax documentation and completion of the
              Stripe payment process, Chaos Tournaments LLC will initiate prize payments
              within <strong className="text-chaos-white">30 calendar days</strong>{" "}
              following the conclusion of the event.
            </p>
          </div>

          <div>
            <SectionHeading id="6-8">6.8 Prize Forfeiture</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              A prize will be considered forfeited under the following circumstances:
            </p>
            <Bullets
              items={[
                "Failure to submit required tax documentation within the 14-day window (Section 6.5.3).",
                "Failure to complete the Stripe payment process within the 7-day window (Section 6.6).",
                "Issuance of a prize forfeiture sanction under Chapter 5.",
                "Discovery of eligibility violations that affected the team's competitive placement.",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Forfeited prizes are retained by Chaos Tournaments LLC and may be
              redistributed at its discretion, including being added to a future
              event&apos;s prize pool.
            </p>
          </div>

          <div>
            <SectionHeading id="6-9">6.9 Disputes Regarding Prize Payment</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Any dispute related to prize payment must be submitted in writing to Chaos
              Tournaments LLC management via the official contact method listed in the
              Discord server within <strong className="text-chaos-white">30 days</strong>{" "}
              of the scheduled payment date. Disputes submitted after this window will not
              be considered.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 7 */}
      <section id="chapter-7" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 7 — <span className="text-chaos-gold">Media, Broadcasting &amp; Sponsorship</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="7-1">7.1 Streaming &amp; Broadcasting</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC retains the right to stream, broadcast, and produce
              content from all official matches it operates.
            </p>
            <Bullets
              items={[
                "Chaos Tournaments LLC may live stream official matches on platforms including but not limited to Twitch, YouTube, and TikTok.",
                "Teams and Players participating in Chaos Tournaments events grant Chaos Tournaments LLC a non-exclusive, royalty-free license to use their name, in-game name, team name, and team logo in connection with the broadcast of any event they participate in.",
                "Individual Players and teams are permitted to stream their own perspective (player POV) during official matches unless explicitly prohibited in event-specific rules communicated via Discord.",
                "Player POV streams must be delayed by a minimum of 90 seconds to prevent stream sniping. Failure to maintain the required delay is a violation of Section 4.2.1.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="7-2">7.2 Content Rights</SectionHeading>
            <Bullets
              items={[
                "Chaos Tournaments LLC owns all broadcast recordings, highlight content, and event production materials it creates.",
                "Participants may clip and share content from their own POV streams or from the official Chaos Tournaments broadcast, provided they do not monetize such content in a manner that conflicts with Chaos Tournaments LLC's own commercial interests without prior written approval.",
                "Any content creation featuring official Chaos Tournaments branding, logos, or event materials requires prior written approval from Chaos Tournaments LLC management.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="7-3">7.3 Sponsorships</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Teams and Players are permitted to carry sponsors during Chaos Tournaments
              events, subject to the following restrictions. Teams must notify Chaos
              Tournaments LLC of active sponsors via the Discord registration process or
              event registration form.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              <strong className="text-chaos-white">
                The following sponsor categories are prohibited without prior written
                approval from Chaos Tournaments LLC:
              </strong>
            </p>
            <Bullets
              items={[
                "Alcohol and tobacco products",
                "Gambling and sports betting platforms (including fantasy esports operators)",
                "Firearms and weapons",
                "Pornographic or adult content",
                "Prescription medications or controlled substances",
                "Competing esports tournament operators or platforms",
                "Any entity deemed by Chaos Tournaments LLC to be harmful to its reputation or brand",
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              All other sponsor categories are permitted provided they are disclosed during
              registration. Chaos Tournaments LLC reserves the right to require removal of
              any sponsor branding that violates these standards, and teams must have
              available an alternative jersey or identity free of prohibited sponsor
              markings.
            </p>
          </div>

          <div>
            <SectionHeading id="7-4">7.4 Product Placement &amp; In-Game Branding</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              During any match that is officially broadcast by Chaos Tournaments LLC,
              Players and Coaches may not:
            </p>
            <Bullets
              items={[
                "Display or promote any brand in their in-game name other than their registered team name or tag.",
                "Perform any deliberate product placement or promotional act on behalf of a sponsor during official broadcast without prior written approval from Chaos Tournaments LLC.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Chapter 8 */}
      <section id="chapter-8" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 8 — <span className="text-chaos-gold">Privacy &amp; Data</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="8-1">8.1 Data Collection</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC collects the following information from participants as
              part of the registration and competition process:
            </p>
            <Bullets
              items={[
                "Legal name and date of birth",
                "Ubisoft username and Ubisoft ID",
                "In-game name",
                "Country of residence",
                "Discord username",
                "Contact email address (Team Representatives)",
                "Tax identification information (prize winners only)",
                "Payment information (processed securely through Stripe — Chaos Tournaments LLC does not store payment details directly)",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="8-2">8.2 Purpose of Data Collection</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Data collected by Chaos Tournaments LLC is used solely for the following
              purposes:
            </p>
            <Bullets
              items={[
                "Verifying participant eligibility",
                "Administering competition rosters and match operations",
                "Processing prize payments",
                "Communicating event information and updates via Discord and email",
                "Maintaining records of sanctions and penalties",
                "Complying with applicable tax and legal obligations",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="8-3">8.3 Data Sharing</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC will not sell participant data to third parties. Data
              may be shared in the following limited circumstances:
            </p>
            <Bullets
              items={[
                "With Stripe, solely for the purpose of processing prize payments.",
                "With legal or tax authorities as required by applicable law.",
                "With tournament bracket platforms (e.g., Battlefy, Challonge, or similar) used to operate events, limited to what is necessary for match administration.",
              ]}
            />
          </div>

          <div>
            <SectionHeading id="8-4">8.4 Data Retention</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Participant data will be retained for a period of no longer than three (3)
              years following the last event in which the participant competed, after which
              it will be securely deleted unless retention is required by law (e.g., for
              tax reporting purposes).
            </p>
          </div>

          <div>
            <SectionHeading id="8-5">8.5 Participant Rights</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Participants may request access to, correction of, or deletion of their
              personal data held by Chaos Tournaments LLC by contacting management through
              the official Discord server or the contact information provided on the Chaos
              Tournaments website. Requests will be processed within 30 days.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 9 */}
      <section id="chapter-9" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Chapter 9 — <span className="text-chaos-gold">General Provisions</span>
        </h2>

        <div className="mt-8 space-y-8">
          <div>
            <SectionHeading id="9-1">9.1 Authority of Tournament Officials</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Tournament Officials appointed by Chaos Tournaments LLC have full authority
              to enforce this rulebook, make real-time rulings during matches, and escalate
              matters to Chaos Tournaments LLC management as needed. Participants are
              required to comply with all Tournament Official instructions promptly and
              respectfully.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Disagreements with a Tournament Official ruling must be raised through the
              proper dispute process outlined in Section 3.7 and Chapter 5 — not through
              argument during an active match.
            </p>
          </div>

          <div>
            <SectionHeading id="9-2">9.2 Modifications to this Rulebook</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC reserves the right to modify, amend, or supplement any
              provision of this rulebook at any time. All modifications will be
              communicated via the official Chaos Tournaments Discord server and/or the
              Chaos Tournaments website. Continued participation in any Chaos Tournaments
              event after a modification is published constitutes acceptance of the updated
              rules.
            </p>
          </div>

          <div>
            <SectionHeading id="9-3">9.3 Event-Specific Rules</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              For each event, Chaos Tournaments LLC may publish additional event-specific
              rules via the Discord server and/or registration form that supplement this
              rulebook. In the event of any conflict between event-specific rules and this
              rulebook, the event-specific rules will take precedence for that event only.
            </p>
          </div>

          <div>
            <SectionHeading id="9-4">9.4 Limitation of Liability</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              Chaos Tournaments LLC, its members, managers, officers, staff, and affiliates
              are not liable for any damages, losses, or injuries arising from
              participation in any Chaos Tournaments event, including but not limited to
              technical failures, match result disputes, prize payment delays, or any other
              circumstance outside of Chaos Tournaments LLC&apos;s reasonable control.
            </p>
          </div>

          <div>
            <SectionHeading id="9-5">9.5 Governing Law</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              This rulebook and all matters arising from participation in Chaos Tournaments
              events are governed by the laws of the state in which Chaos Tournaments LLC
              is registered, without regard to conflict of law principles.
            </p>
          </div>

          <div>
            <SectionHeading id="9-6">9.6 Entire Agreement</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              This rulebook, together with any event-specific rules published by Chaos
              Tournaments LLC, constitutes the entire agreement between Chaos Tournaments
              LLC and its participants with respect to competitive conduct and event
              participation. It supersedes any prior communications, understandings, or
              agreements on these matters.
            </p>
          </div>

          <div>
            <SectionHeading id="9-7">9.7 Severability</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-chaos-white/70">
              If any provision of this rulebook is found to be unenforceable or invalid
              under applicable law, that provision will be modified to the minimum extent
              necessary to make it enforceable, and all other provisions will remain in
              full force and effect.
            </p>
          </div>
        </div>
      </section>

      {/* Appendices */}
      <section id="appendices" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-chaos-white md:text-3xl">
          Appendices
        </h2>

        <div className="mt-8 space-y-10">
          <div>
            <SectionHeading id="appendix-a">Appendix A — Quick Reference: Match Settings</SectionHeading>
            <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 pl-4 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Setting</th>
                    <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Game Mode", "Bomb"],
                    ["Number of Rounds", "12"],
                    ["Role Swap", "Round 6"],
                    ["Overtime Rounds", "3 (or Infinite)"],
                    ["Overtime Score Difference to Win", "2"],
                    ["Tactical Timeout Per Team", "1 per map (45 seconds)"],
                    ["Role Swap Timeout", "On — 120 seconds"],
                    ["Ban Timer", "20 seconds"],
                    ["Operator HP", "100"],
                    ["Friendly Fire", "100%"],
                    ["Preparation Phase", "45 seconds"],
                    ["Action Phase", "180 seconds"],
                    ["Plant Duration", "7 seconds"],
                    ["Defuse Duration", "7 seconds"],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-white/5 last:border-b-0">
                      <td className="whitespace-nowrap py-2.5 pl-4 pr-4 font-medium text-chaos-white/90">{label}</td>
                      <td className="py-2.5 pr-4 text-chaos-white/70">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <SectionHeading id="appendix-b">Appendix B — Quick Reference: Sanction Levels</SectionHeading>
            <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 pl-4 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Violation</th>
                    <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Minimum Sanction</th>
                    <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Maximum Sanction</th>
                  </tr>
                </thead>
                <tbody>
                  {SANCTION_LEVELS.map(([violation, min, max]) => (
                    <tr key={violation} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2.5 pl-4 pr-4 font-medium text-chaos-white/90">{violation}</td>
                      <td className="py-2.5 pr-4 text-chaos-white/70">{min}</td>
                      <td className="py-2.5 pr-4 text-chaos-white/70">{max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <SectionHeading id="appendix-c">Appendix C — Discord Channel Guide</SectionHeading>
            <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 pl-4 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Channel</th>
                    <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-chaos-gold">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {DISCORD_CHANNELS.map(([channel, purpose]) => (
                    <tr key={channel} className="border-b border-white/5 last:border-b-0">
                      <td className="whitespace-nowrap py-2.5 pl-4 pr-4 font-mono text-xs text-chaos-gold">{channel}</td>
                      <td className="py-2.5 pr-4 text-chaos-white/70">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="mt-20 border-t border-white/10 pt-8 text-center">
        <p className="text-sm text-chaos-white/50">
          Chaos Tournaments LLC — Official Rulebook Version 1.0
        </p>
        <p className="mt-1 text-xs text-chaos-white/40">
          All rights reserved. Chaos Tournaments LLC.
        </p>
      </footer>
    </div>
  );
}
