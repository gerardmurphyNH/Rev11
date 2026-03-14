import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A2240",
          light: "#0D2D52",
          dark: "#061629",
        },
        red: {
          revs: "#CE0E2D",
          dark: "#A50B24",
          light: "#E01230",
        },
        parchment: {
          DEFAULT: "#F5F0E8",
          dark: "#EDE7D9",
        },
        gold: {
          DEFAULT: "#C5A55A",
          light: "#D4B870",
          dark: "#A88A40",
        },
        field: {
          DEFAULT: "#2D5A27",
          light: "#3A7332",
        },
        charcoal: "#1A1A1A",
        warmwhite: "#FAFAF7",
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-source-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "parchment-texture": "url('/images/parchment-bg.png')",
        "diagonal-red":
          "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(206,14,45,0.05) 2px, rgba(206,14,45,0.05) 4px)",
      },
      animation: {
        slam: "slam 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
        "musket-blast": "musketBlast 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "pulse-red": "pulseRed 1.5s ease-in-out infinite",
        "count-down": "countDown 1s ease-in-out",
      },
      keyframes: {
        slam: {
          "0%": { transform: "scale(1.4)", opacity: "0" },
          "60%": { transform: "scale(0.95)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        musketBlast: {
          "0%": { transform: "scale(0.5)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        fadeUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(206,14,45,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(206,14,45,0)" },
        },
        countDown: {
          "0%": { color: "#CE0E2D", transform: "scale(1.1)" },
          "100%": { color: "inherit", transform: "scale(1)" },
        },
      },
      boxShadow: {
        card: "0 2px 8px rgba(10,34,64,0.15)",
        "card-hover": "0 4px 16px rgba(10,34,64,0.25)",
        "inner-navy": "inset 0 2px 4px rgba(10,34,64,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
