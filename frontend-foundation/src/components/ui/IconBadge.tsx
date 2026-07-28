type IconBadgeProps = {
  icon: "spark" | "shield" | "review" | "workflow" | "lock" | "link" | "check" | "file";
  tone?: "blue" | "dark" | "cyan" | "emerald";
  className?: string;
};

const iconPaths = {
  spark: "M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z",
  shield: "M12 3l7 3v5c0 4.4-2.9 8.3-7 9.6C7.9 19.3 5 15.4 5 11V6l7-3z",
  review: "M6 5h12v14H6V5zm3 4h6M9 13h6M9 17h3",
  workflow: "M6 7h4v4H6V7zm8 0h4v4h-4V7zM8 11v4h8v-4M10 17h4",
  lock: "M7 11h10v8H7v-8zm2 0V8a3 3 0 016 0v3",
  link: "M9.5 14.5l5-5M8 11l-1 1a3 3 0 104.2 4.2l1-1M12 8l1-1a3 3 0 114.2 4.2l-1 1",
  check: "M5 12l4 4L19 6",
  file: "M7 3h7l4 4v14H7V3zm7 0v5h4M10 13h5M10 17h4"
};

const toneClasses = {
  blue: "bg-blue-50 text-brand-blue ring-blue-100",
  dark: "bg-slate-900 text-white ring-slate-700",
  cyan: "bg-cyan-50 text-brand-cyan ring-cyan-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100"
};

export function IconBadge({ icon, tone = "blue", className = "" }: IconBadgeProps) {
  return (
    <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]} ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none">
        <path
          d={iconPaths[icon]}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
