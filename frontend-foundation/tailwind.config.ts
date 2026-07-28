import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        fintech: "0 1px 2px rgba(20,26,34,0.05), 0 4px 8px -2px rgba(20,26,34,0.06)",
        premium: "0 16px 32px -8px rgba(20,26,34,0.14)",
        soft: "0 1px 2px rgba(20,26,34,0.05)"
      },
      colors: {
        brand: {
          navy: "#141A22",
          blue: "#0B4A75",
          cyan: "#1B6EA3",
          ink: "#141A22",
          mist: "#EEF1EE",
          surface: "#FCFDFC",
          rule: "#D2D9D3",
          credit: "#14704A",
          due: "#A15C07",
          notice: "#B3261E"
        }
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 150ms cubic-bezier(0.4,0,0.2,1) both"
      }
    }
  },
  plugins: []
} satisfies Config;
