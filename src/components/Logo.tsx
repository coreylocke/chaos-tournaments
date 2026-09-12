import Image from "next/image";

type LogoProps = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
};

/**
 * Chaos Tournaments logomark (gold variant).
 * Uses the header SVG export from the brand kit (public/logos/logo-gold-header.svg).
 */
export default function Logo({ className, size = 40, withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/logos/logo-gold-header.svg"
        alt="Chaos Tournaments"
        width={size}
        height={size}
        priority
      />
      {withWordmark && (
        <span className="font-display text-lg font-bold uppercase tracking-wider text-chaos-white">
          Chaos <span className="text-chaos-gold">Tournaments</span>
        </span>
      )}
    </span>
  );
}
