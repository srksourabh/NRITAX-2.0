/**
 * NRITAX — the calculation expression evaluator.
 *
 * Every CalcDef.expr in the form schema is a small arithmetic expression over
 * fields, other calcs and table totals. The prototypes in docs/reference ran
 * those strings through eval(); this does not. The text is tokenised, parsed by
 * recursive descent and walked, so nothing a taxpayer can influence ever
 * reaches the JavaScript engine.
 *
 * Grammar
 *   expression := term (("+" | "-") term)*
 *   term       := unary (("*" | "/") unary)*
 *   unary      := ("+" | "-")? primary
 *   primary    := number | identifier | call | "(" expression ")"
 *   call       := NAME "(" [ expression ("," expression)* ] ")"
 *
 * Functions
 *   MIN, MAX, SUM   one or more arguments
 *   ROUND, ABS      one argument
 *   ROUND10         one argument, rounded to the nearest ten rupees (s. 288B)
 *   T(table.column) total of one column of a table
 *   Q(grid)         total of a quarterly grid
 *
 * R and R10 are accepted as the prototype's spellings of ROUND and ROUND10.
 */

import type { FieldValue, ReturnData, ScheduleDef, TableRow } from '@/lib/itr/types';
import { r0, r10 } from '@/lib/itr/types';
import { D, Decimal } from '@/lib/itr/compute/decimal';

/** Raised by the tokeniser, the parser and the walker. Never escapes runCalcs. */
export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalcError';
  }
}

/**
 * Values the schedules name but do not define. A bare identifier — `xTax` from
 * the tax computation engine — is looked up by name; a call the grammar does
 * not define — `B(total)` from the set-off engine, `S(adv)` from the challan
 * split — is looked up by its exact text.
 */
export type CalcExternals = Readonly<Record<string, number>>;

export interface CalcProblem {
  /** Fully qualified key of the calc whose expression failed. */
  key: string;
  message: string;
}

export interface CalcRun {
  /** Keyed by `${scheduleId}.${calcKey}`, and by the bare key where unambiguous. */
  values: Record<string, number>;
  problems: CalcProblem[];
}

/* ─────────────────────────── Tokens ─────────────────────────── */

type TokenKind = 'num' | 'name' | 'op' | 'lparen' | 'rparen' | 'comma';

interface Token {
  kind: TokenKind;
  text: string;
  at: number;
}

const NUMBER = /[0-9]+(?:\.[0-9]+)?/y;
const NAME = /[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/y;

function tokenise(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i += 1;
      continue;
    }
    if (c >= '0' && c <= '9') {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(src);
      if (!m) throw new CalcError(`bad number at position ${i}`);
      tokens.push({ kind: 'num', text: m[0], at: i });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      NAME.lastIndex = i;
      const m = NAME.exec(src);
      if (!m) throw new CalcError(`bad identifier at position ${i}`);
      tokens.push({ kind: 'name', text: m[0], at: i });
      i += m[0].length;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ kind: 'op', text: c, at: i });
      i += 1;
      continue;
    }
    if (c === '(' || c === ')' || c === ',') {
      tokens.push({ kind: c === '(' ? 'lparen' : c === ')' ? 'rparen' : 'comma', text: c, at: i });
      i += 1;
      continue;
    }
    throw new CalcError(`unexpected character "${c}" at position ${i}`);
  }
  return tokens;
}

/* ─────────────────────────── Syntax tree ─────────────────────────── */

type Node =
  | { kind: 'num'; value: number }
  | { kind: 'ref'; name: string }
  | { kind: 'column'; table: string; column: string }
  | { kind: 'grid'; grid: string }
  | { kind: 'hook'; text: string }
  | { kind: 'call'; name: FunctionName; args: Node[] }
  | { kind: 'unary'; negate: boolean; arg: Node }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/'; left: Node; right: Node };

type FunctionName = 'MIN' | 'MAX' | 'SUM' | 'ABS' | 'ROUND' | 'ROUND10';

const FUNCTIONS: Record<FunctionName, { min: number; max: number }> = {
  MIN: { min: 1, max: Infinity },
  MAX: { min: 1, max: Infinity },
  SUM: { min: 1, max: Infinity },
  ABS: { min: 1, max: 1 },
  ROUND: { min: 1, max: 1 },
  ROUND10: { min: 1, max: 1 },
};

const ALIASES: Record<string, FunctionName> = { R: 'ROUND', R10: 'ROUND10' };

function canonical(name: string): FunctionName | undefined {
  const resolved = ALIASES[name] ?? name;
  return resolved in FUNCTIONS ? (resolved as FunctionName) : undefined;
}

/** Parse one expression. Throws CalcError on anything the grammar does not cover. */
function parseExpr(src: string): Node {
  const tokens = tokenise(src);
  let at = 0;

  const peek = (offset = 0): Token | undefined => tokens[at + offset];

  const take = (kind: TokenKind, what: string): Token => {
    const token = peek();
    if (!token || token.kind !== kind) {
      throw new CalcError(`expected ${what} in "${src}"`);
    }
    at += 1;
    return token;
  };

  function call(name: string): Node {
    take('lparen', `"(" after ${name}`);
    // T, Q and the schedule hooks take a bare name, not an arithmetic argument.
    const single =
      peek()?.kind === 'name' && peek(1)?.kind === 'rparen' ? (peek() as Token).text : undefined;

    if (name === 'T') {
      if (single === undefined || !single.includes('.')) {
        throw new CalcError('T() takes one table.column name');
      }
      at += 2;
      const dot = single.indexOf('.');
      return { kind: 'column', table: single.slice(0, dot), column: single.slice(dot + 1) };
    }
    if (name === 'Q') {
      if (single === undefined) throw new CalcError('Q() takes one grid name');
      at += 2;
      return { kind: 'grid', grid: single };
    }

    const fn = canonical(name);
    if (!fn) {
      if (single === undefined) throw new CalcError(`unknown function ${name}() in "${src}"`);
      at += 2;
      return { kind: 'hook', text: `${name}(${single})` };
    }

    const args: Node[] = [];
    if (peek()?.kind !== 'rparen') {
      args.push(expression());
      while (peek()?.kind === 'comma') {
        at += 1;
        args.push(expression());
      }
    }
    take('rparen', `")" closing ${name}()`);
    const arity = FUNCTIONS[fn];
    if (args.length < arity.min || args.length > arity.max) {
      throw new CalcError(`${fn}() takes ${arity.max === Infinity ? 'at least ' : ''}${arity.min} argument${arity.min > 1 ? 's' : ''}`);
    }
    return { kind: 'call', name: fn, args };
  }

  function primary(): Node {
    const token = peek();
    if (!token) throw new CalcError(`"${src}" ends early`);
    if (token.kind === 'num') {
      at += 1;
      return { kind: 'num', value: Number.parseFloat(token.text) };
    }
    if (token.kind === 'name') {
      at += 1;
      return peek()?.kind === 'lparen' ? call(token.text) : { kind: 'ref', name: token.text };
    }
    if (token.kind === 'lparen') {
      at += 1;
      const inner = expression();
      take('rparen', '")"');
      return inner;
    }
    throw new CalcError(`unexpected "${token.text}" in "${src}"`);
  }

  function unary(): Node {
    const token = peek();
    if (token?.kind === 'op' && (token.text === '-' || token.text === '+')) {
      at += 1;
      return { kind: 'unary', negate: token.text === '-', arg: unary() };
    }
    return primary();
  }

  function term(): Node {
    let left = unary();
    for (;;) {
      const token = peek();
      if (token?.kind !== 'op' || (token.text !== '*' && token.text !== '/')) return left;
      at += 1;
      left = { kind: 'binary', op: token.text, left, right: unary() };
    }
  }

  function expression(): Node {
    let left = term();
    for (;;) {
      const token = peek();
      if (token?.kind !== 'op' || (token.text !== '+' && token.text !== '-')) return left;
      at += 1;
      left = { kind: 'binary', op: token.text, left, right: term() };
    }
  }

  const node = expression();
  if (at < tokens.length) {
    throw new CalcError(`unexpected "${(peek() as Token).text}" in "${src}"`);
  }
  return node;
}

/* ─────────────────────────── Walking ─────────────────────────── */

/** What an expression may reach outside itself. */
interface Scope {
  ref(name: string): number;
  column(table: string, column: string): number;
  grid(key: string): number;
  hook(text: string): number;
}

function walk(node: Node, scope: Scope): Decimal {
  switch (node.kind) {
    case 'num':
      return D(node.value);
    case 'ref':
      return D(scope.ref(node.name));
    case 'column':
      return D(scope.column(node.table, node.column));
    case 'grid':
      return D(scope.grid(node.grid));
    case 'hook':
      return D(scope.hook(node.text));
    case 'unary': {
      const value = walk(node.arg, scope);
      return node.negate ? value.neg() : value;
    }
    case 'binary': {
      const left = walk(node.left, scope);
      const right = walk(node.right, scope);
      if (node.op === '+') return left.plus(right);
      if (node.op === '-') return left.minus(right);
      if (node.op === '*') return left.mul(right);
      if (right.isZero()) throw new CalcError('division by zero');
      return left.div(right);
    }
    case 'call': {
      const args = node.args.map((a) => walk(a, scope));
      switch (node.name) {
        case 'MIN':
          return Decimal.min(...args);
        case 'MAX':
          return Decimal.max(...args);
        case 'SUM':
          return args.reduce((a, b) => a.plus(b), new Decimal(0));
        case 'ABS':
          return args[0]!.abs();
        case 'ROUND':
          return D(Math.round(args[0]!.toNumber()));
        case 'ROUND10':
          return D(r10(args[0]!.toNumber()));
      }
    }
  }
}

/* ─────────────────────────── Resolution ─────────────────────────── */

function num(value: FieldValue | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface IndexedCalc {
  qualified: string;
  bare: string;
  expr: string;
}

/**
 * Index every calc in the given schedules by `${scheduleId}.${calcKey}` and, so
 * long as no other schedule uses the same bare key, by the bare key too. The
 * validation rules refer to calcs by the bare key and the expressions qualify
 * them, and both have to resolve to the same figure.
 */
function indexCalcs(schedules: readonly ScheduleDef[]): Map<string, IndexedCalc> {
  const all: IndexedCalc[] = [];
  const bareCount = new Map<string, number>();
  for (const schedule of schedules) {
    for (const section of schedule.sections) {
      for (const calc of section.calcs ?? []) {
        all.push({ qualified: `${schedule.id}.${calc.key}`, bare: calc.key, expr: calc.expr });
        bareCount.set(calc.key, (bareCount.get(calc.key) ?? 0) + 1);
      }
    }
  }
  const index = new Map<string, IndexedCalc>();
  for (const calc of all) {
    index.set(calc.qualified, calc);
    if (bareCount.get(calc.bare) === 1) index.set(calc.bare, calc);
  }
  return index;
}

function nonEmpty(rows: readonly TableRow[] | undefined): readonly TableRow[] {
  return (rows ?? []).filter((row) => Object.values(row).some((v) => (v ?? '') !== ''));
}

/**
 * Resolve every calc in the given schedules, in dependency order, and report
 * what could not be resolved. A calc whose expression fails — a cycle, an
 * unknown function, a division by zero — is nil, and one problem is recorded
 * against it; the calcs that depend on it still compute.
 */
export function runCalcs(
  schedules: readonly ScheduleDef[],
  data: ReturnData,
  externals: CalcExternals = {},
): CalcRun {
  const index = indexCalcs(schedules);
  const problems: CalcProblem[] = [];
  const resolved = new Map<string, number>();
  const visiting = new Set<string>();

  const scope: Scope = {
    ref(name) {
      const calc = index.get(name);
      // A calc wins over a field of the same name, so a stored copy of a
      // computed figure can never shadow the computation.
      if (calc) return value(calc);
      if (Object.hasOwn(data.fields, name)) return num(data.fields[name]);
      return externals[name] ?? 0;
    },
    column(table, column) {
      return nonEmpty(data.tables[table]).reduce((total, row) => total + num(row[column]), 0);
    },
    grid(key) {
      // A quarterly grid is either a table of its own or, once flattened into
      // the schema, a run of fields keyed `${grid}_${window}`.
      const rows = data.tables[key];
      if (rows) {
        return nonEmpty(rows).reduce(
          (total, row) => total + Object.values(row).reduce((a: number, v) => a + num(v), 0),
          0,
        );
      }
      const prefix = `${key}_`;
      return Object.entries(data.fields).reduce(
        (total, [fieldKey, fieldValue]) =>
          fieldKey.slice(fieldKey.indexOf('.') + 1).startsWith(prefix) ? total + num(fieldValue) : total,
        0,
      );
    },
    hook(text) {
      return externals[text] ?? 0;
    },
  };

  function value(calc: IndexedCalc): number {
    const cached = resolved.get(calc.qualified);
    if (cached !== undefined) return cached;
    if (visiting.has(calc.qualified)) {
      throw new CalcError(`${[...visiting, calc.qualified].join(' → ')} is a circular reference`);
    }
    visiting.add(calc.qualified);
    let computed = 0;
    try {
      computed = r0(walk(parseExpr(calc.expr), scope).toNumber());
      if (!Number.isFinite(computed)) throw new CalcError('the result is not a number');
    } catch (error) {
      problems.push({
        key: calc.qualified,
        message: error instanceof Error ? error.message : String(error),
      });
      computed = 0;
    } finally {
      visiting.delete(calc.qualified);
    }
    resolved.set(calc.qualified, computed);
    return computed;
  }

  const values: Record<string, number> = {};
  for (const [key, calc] of index) values[key] = value(calc);
  return { values, problems };
}

/**
 * Every calc across the given schedules, keyed by `${scheduleId}.${calcKey}`
 * and by the bare calc key where that is unambiguous. Expressions that cannot
 * be resolved come back as nil; use runCalcs when you need to know why.
 */
export function evaluateCalcs(
  schedules: readonly ScheduleDef[],
  data: ReturnData,
  externals: CalcExternals = {},
): Record<string, number> {
  return runCalcs(schedules, data, externals).values;
}
