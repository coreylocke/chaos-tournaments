import Link from "next/link";

/**
 * Sticky bottom CTA bar for mobile, per Section 54 (mobile-first design requirements).
 * Hidden on desktop where the header CTA is already visible.
 */
export default function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-chaos-black/95 p-3 backdrop-blur md:hidden">
      <Link
        href="/tournaments"
        className="touch-target flex w-full items-center justify-center rounded-md bg-chaos-gold text-base font-bold text-chaos-black shadow-gold-glow"
      >
        View Tournaments
      </Link>
    </div>
  );
}
