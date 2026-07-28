'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

/**
 * Compact "?" control that reveals field guidance without cluttering the form.
 * Works on touch (tap) and keyboard; closes on outside click / Escape.
 */
export function FieldHelp({
  label,
  text,
  className,
}: {
  label: string;
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn('ntx-field-help', className)}>
      <button
        type="button"
        className="ntx-field-help-btn"
        aria-label={`Help: ${label}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      {open ? (
        <span id={panelId} role="note" className="ntx-field-help-panel">
          {text}
        </span>
      ) : null}
    </span>
  );
}
