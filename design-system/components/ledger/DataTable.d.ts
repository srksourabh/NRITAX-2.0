import React from 'react';

export interface DataTableColumn {
  key: string;
  header: string;
  /** Amount columns are right-aligned, Plex Mono, prefixed with ₹ and grouped en-IN. */
  amount?: boolean;
}

export interface DataTableProps {
  columns?: DataTableColumn[];
  rows?: Array<Record<string, any>>;
  /** Mobile rendering: one card per row with the amount as the leading figure. Never horizontal scroll. */
  stacked?: boolean;
  caption?: string;
  /** Right-aligned overflow menu per row — never an always-visible icon cluster. */
  rowAction?: (row: Record<string, any>, index: number) => React.ReactNode;
}

/** Schedule tables: capital gains entries, TDS deductors, advance tax challans. */
export declare function DataTable(props: DataTableProps): JSX.Element;
