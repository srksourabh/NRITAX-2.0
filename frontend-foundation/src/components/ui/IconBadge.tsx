import {
  BadgeCheck,
  FileCheck2,
  FileJson,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Workflow
} from "lucide-react";

type IconBadgeProps = {
  icon: "spark" | "shield" | "review" | "workflow" | "lock" | "link" | "check" | "file";
  tone?: "blue" | "dark" | "cyan" | "emerald";
  className?: string;
};

const icons = {
  spark: Sparkles,
  shield: ShieldCheck,
  review: FileCheck2,
  workflow: Workflow,
  lock: LockKeyhole,
  link: Link2,
  check: BadgeCheck,
  file: FileJson
};

const toneClasses = {
  blue: "bg-[rgba(11,107,255,0.09)] text-brand-blue ring-[rgba(11,107,255,0.22)]",
  dark: "bg-white/10 text-brand-surface ring-white/15",
  cyan: "bg-[#E8F1F7] text-brand-blue ring-[rgba(96,165,250,0.28)]",
  emerald: "bg-[rgba(25,195,125,0.10)] text-brand-credit ring-[rgba(25,195,125,0.24)]"
};

export function IconBadge({ icon, tone = "blue", className = "" }: IconBadgeProps) {
  const Icon = icons[icon];

  return (
    <span className={`icon-float inline-flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses[tone]} ${className}`}>
      <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
    </span>
  );
}
