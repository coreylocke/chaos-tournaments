"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/grudge-matches", label: "Grudge Matches" },
  { href: "/teams", label: "Teams" },
  { href: "/rules", label: "Rules" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-chaos-black/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="touch-target flex items-center">
          <Logo size={36} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-chaos-white/80 transition hover:text-chaos-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/login"
            className="touch-target inline-flex items-center rounded-md bg-chaos-gold px-4 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow"
          >
            Login with Discord
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="touch-target flex items-center justify-center rounded-md text-chaos-white md:hidden"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-chaos-black px-4 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="touch-target flex items-center rounded-md px-2 text-base font-medium text-chaos-white/90 hover:bg-white/5 hover:text-chaos-gold"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="touch-target mt-2 flex items-center justify-center rounded-md bg-chaos-gold px-4 text-base font-bold text-chaos-black"
          >
            Login with Discord
          </Link>
        </nav>
      )}
    </header>
  );
}
