"use client";

import dynamic from "next/dynamic";

// Three.js touches window/WebGL — must never run during SSR.
const ParticleField = dynamic(() => import("./ParticleField"), {
  ssr: false,
});

export default function ParticleFieldCanvas({ className }: { className?: string }) {
  return <ParticleField className={className} />;
}
