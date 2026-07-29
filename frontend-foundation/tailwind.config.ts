import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        fintech: "0 12px 30px rgba(15, 23, 42, 0.08)",
        premium: "0 18px 46px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(11, 107, 255, 0.14), 0 18px 42px rgba(11, 107, 255, 0.18)",
        soft: "0 10px 28px rgba(15, 23, 42, 0.07)"
      },
      colors: {
        brand: {
          navy: "#0F172A",
          blue: "#0B6BFF",
          cyan: "#60A5FA",
          ink: "#0F172A",
          mist: "#F8FAFC",
          surface: "#FFFFFF",
          rule: "#E2E8F0",
          credit: "#19C37D",
          due: "#F59E0B",
          notice: "#DC2626",
          muted: "#64748B",
          line: "#E5E7EB",
          gold: "#F8D26A"
        }
      },
      fontFamily: {
        heading: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.05", fontWeight: "800" }],
        section: ["36px", { lineHeight: "1.14", fontWeight: "800" }],
        card: ["22px", { lineHeight: "1.18", fontWeight: "800" }],
        "body-lg": ["18px", { lineHeight: "1.55", fontWeight: "450" }],
        body: ["16px", { lineHeight: "1.55", fontWeight: "450" }],
        caption: ["14px", { lineHeight: "1.45", fontWeight: "500" }],
        nav: ["15px", { lineHeight: "1.4", fontWeight: "600" }],
        button: ["16px", { lineHeight: "1.35", fontWeight: "600" }],
        form: ["16px", { lineHeight: "1.5", fontWeight: "500" }]
      }
    }
  },
  plugins: []
} satisfies Config;
