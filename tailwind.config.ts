import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        celeste: {
          50: "#F2FAFF",
          100: "#E1F3FD",
          200: "#BEE3F8",
          300: "#8FCFEF",
          400: "#63B8E3",
          500: "#4FA8D8",
          600: "#3A8CBE",
          700: "#2E6F97"
        },
        tinta: "#0F1B2D"
      },
      fontFamily: {
        sans: ["var(--font-barlow)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.02em"
      },
      borderRadius: {
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
} satisfies Config;
