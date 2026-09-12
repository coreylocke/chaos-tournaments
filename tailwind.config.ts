import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        chaos: {
          black: "#0A0A0A",
          charcoal: "#161616",
          gold: "#FACC15",
          "gold-dark": "#B8860B",
          white: "#F5F5F5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "gold-glow": "0 0 24px rgba(250, 204, 21, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
