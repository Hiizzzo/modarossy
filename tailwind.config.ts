import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        celeste: {
          50: "#FFF0F7",
          100: "#FFDCEC",
          200: "#FFB8D9",
          300: "#FF8FC1",
          400: "#FF63A6",
          500: "#FF3D8F",
          600: "#E81E76",
          700: "#B8155A"
        },
        tinta: "#1A0A14"
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
