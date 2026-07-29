import type { HTMLAttributes, PropsWithChildren } from "react";

type SectionRevealProps = PropsWithChildren<{
  className?: string;
}> &
  HTMLAttributes<HTMLDivElement>;

export function SectionReveal({ children, className = "", ...props }: SectionRevealProps) {
  return <div className={className} {...props}>{children}</div>;
}
