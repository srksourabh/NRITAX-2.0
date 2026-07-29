/**
 * Exact decimal helpers for tax and calc arithmetic.
 *
 * All intermediate money math should go through Decimal so floating-point
 * drift (0.1 + 0.2 style) cannot change rounded departmental figures.
 */

import Decimal from 'decimal.js';

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

export type DecimalLike = Decimal.Value;

/** Construct a Decimal from any numeric / string input. */
export function D(n: DecimalLike): Decimal {
  try {
    return new Decimal(n ?? 0);
  } catch {
    return new Decimal(0);
  }
}

/** Round half-up to the nearest whole rupee. */
export function roundRupee(n: DecimalLike): number {
  return D(n).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/** Round half-up to the nearest ten rupees (section 288B). */
export function roundTen(n: DecimalLike): number {
  return D(n)
    .div(10)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .mul(10)
    .toNumber();
}

/** Floor to the nearest hundred rupees (Rule 119A interest base). */
export function floorHundred(n: DecimalLike): number {
  const v = D(n);
  if (v.lte(0)) return 0;
  return v.div(100).toDecimalPlaces(0, Decimal.ROUND_FLOOR).mul(100).toNumber();
}

/** Safe Decimal add of many values. */
export function sumD(...values: DecimalLike[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(D(v)), new Decimal(0));
}

/** Clamp to >= 0. */
export function max0(n: DecimalLike): Decimal {
  const v = D(n);
  return v.lt(0) ? new Decimal(0) : v;
}

/** Clamp to <= upper. */
export function minD(a: DecimalLike, b: DecimalLike): Decimal {
  const left = D(a);
  const right = D(b);
  return left.lt(right) ? left : right;
}
