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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#1769FF", // Electric Blue
          primaryHover: "#0E52D6",
          navy: "#0B1736",    // Dark Navy
          navyLight: "#132147",
          surface: "#F8FAFC", // Very light blue-grey
          muted: "#64748B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
