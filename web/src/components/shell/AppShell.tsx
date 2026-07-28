import Link from 'next/link';

import { cn } from '@/lib/cn';

export function AppShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="ntx-shell-header">
        <Link href="/" className="ntx-brand">
          NRITAX
        </Link>
        <div className="flex items-center gap-3 text-[var(--body-sm)] text-[var(--neutral-300)]">
          {right}
        </div>
      </header>
      {children}
    </div>
  );
}

export function FormChoiceCard({
  title,
  subtitle,
  selected,
  onSelect,
  busy,
}: {
  title: string;
  subtitle: string;
  selected?: boolean;
  onSelect: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={busy}
      aria-pressed={selected}
      className={cn(
        'ntx-panel ntx-choice-card w-full p-6 text-left',
        selected && 'ntx-choice-card-selected',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="ntx-display-sm text-[var(--ink)]">{title}</div>
        {selected ? (
          <span className="ntx-badge ntx-badge-credit shrink-0">Selected</span>
        ) : null}
      </div>
      <p className="mt-3 text-[var(--text-muted)]">{subtitle}</p>
      <div className="mt-6 ntx-double-rule w-24" />
      <p className="mt-4 text-[var(--body-sm)] font-semibold text-[var(--primary)]">
        {busy ? 'Opening…' : 'Click to open this form'}
      </p>
    </button>
  );
}
