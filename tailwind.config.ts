import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        brand: {
          primary: "var(--brand-primary, #1769FF)",
          primaryHover: "var(--brand-primary-hover, #0E52D6)",
          navy: "var(--brand-navy, #0B1736)",
          navyLight: "var(--brand-navy-light, #132147)",
          surface: "var(--brand-surface, #F8FAFC)",
          muted: "var(--brand-muted, #64748B)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
