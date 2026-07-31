type NritaxSealProps = {
  className?: string;
  size?: number;
  title?: string;
};

/** Circular seal mark — ink disc, seal ring, mono NT / 2.0. No gradients. */
export function NritaxSeal({
  className,
  size = 44,
  title = 'NRITAX 2.0',
}: NritaxSealProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="currentColor"
        className="text-[var(--ink)]"
        stroke="var(--seal)"
        strokeWidth="2.5"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontFamily="var(--font-figure), ui-monospace, monospace"
        fontSize="16"
        fontWeight="700"
        fill="#8FE3D0"
        letterSpacing="0.04em"
      >
        NT
      </text>
      <text
        x="32"
        y="48"
        textAnchor="middle"
        fontFamily="var(--font-figure), ui-monospace, monospace"
        fontSize="6.5"
        fontWeight="600"
        fill="#6E8FA0"
        letterSpacing="0.18em"
      >
        2.0
      </text>
    </svg>
  );
}
