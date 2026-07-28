import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        fintech: "0 24px 80px rgba(15, 23, 42, 0.12)",
        soft: "0 14px 40px rgba(37, 99, 235, 0.10)"
      },
      colors: {
        brand: {
          navy: "#10243E",
          blue: "#2563EB",
          cyan: "#0EA5E9",
          ink: "#0F172A"
        }
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 700ms ease-out both"
      }
    }
  },
  plugins: []
} satisfies Config;
