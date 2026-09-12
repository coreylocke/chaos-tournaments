import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-chaos-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <Logo size={32} />

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-chaos-white/70">
          <Link href="/tournaments" className="hover:text-chaos-gold">Tournaments</Link>
          <Link href="/grudge-matches" className="hover:text-chaos-gold">Grudge Matches</Link>
          <Link href="/rules" className="hover:text-chaos-gold">Rules</Link>
          <Link href="/support" className="hover:text-chaos-gold">Support</Link>
        </nav>

        <p className="text-xs text-chaos-white/40">
          © {new Date().getFullYear()} Chaos Tournaments. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
