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
}: {
  title: string;
  subtitle: string;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'ntx-panel w-full p-6 text-left transition-[border-color,background] duration-150',
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-50)]'
          : 'hover:border-[var(--primary-200)]',
      )}
    >
      <div className="ntx-display-sm text-[var(--ink)]">{title}</div>
      <p className="mt-3 text-[var(--text-muted)]">{subtitle}</p>
      <div className="mt-6 ntx-double-rule w-24" />
    </button>
  );
}
