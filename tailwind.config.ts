import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bowling theme
        bowling: {
          red: "#D32F2F",
          "red-dark": "#B71C1C",
        },
        // Traffic light system
        traffic: {
          red: "#EF4444",
          yellow: "#F59E0B",
          green: "#22C55E",
        },
        // UI colors
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
