"""
Realised capital gains from a parsed consolidated account statement.

Matching is FIFO within a folio and scheme: every redemption consumes the oldest
unconsumed purchase lots, and each (lot, redemption) pair becomes one gain leg.
The holding-period split follows the rules for transfers on or after 23 July
2024 — more than 12 months is long term for an equity-oriented scheme, more than
24 months for anything else. Section 112A grandfathering uses the cost that
section 55(2)(ac) prescribes: the higher of the actual cost and the lower of the
sale value and the fair market value as on 31 January 2018.

A consolidated account statement does not carry 31 January 2018 net asset
values. Where a leg needs one and the caller has not supplied it, the leg is
computed on actual cost and the scheme is named in `warnings` — the figure is
not guessed.

Nothing here imports casparser. It reads the wire models in models.py, so the
arithmetic is testable without a PDF.
"""

from __future__ import annotations

import calendar
import re
from collections import deque
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from .models import (
    AssetClass,
    Folio,
    GainEntry,
    GainSummary,
    Quarterly,
    Scheme,
    Schedule112ARow,
    Transaction,
)

GRANDFATHER_DATE = date(2018, 1, 31)
EQUITY_LONG_TERM_MONTHS = 12
OTHER_LONG_TERM_MONTHS = 24

ZERO = Decimal(0)
_FINANCIAL_YEAR = re.compile(r"^(\d{4})-(\d{2})$")

#: casparser transaction types that add units at a stated cost.
BUY_TYPES = frozenset(
    {
        "PURCHASE",
        "PURCHASE_SIP",
        "SWITCH_IN",
        "SWITCH_IN_MERGER",
        "DIVIDEND_REINVEST",
        "SEGREGATION",
        "GIFT_IN",
    }
)
#: Types that remove units against consideration, so a gain arises.
SELL_TYPES = frozenset({"REDEMPTION", "SWITCH_OUT"})
#: Types that remove units without a transfer chargeable to tax — a scheme
#: merger under section 47(xviii), a gift under section 47(iii). The lots are
#: consumed so the ledger stays right, but no gain is reported.
EXEMPT_OUT_TYPES = frozenset({"SWITCH_OUT_MERGER", "GIFT_OUT"})

#: Scheme-name fragments that put a fund on the debt side when nothing else says.
DEBT_NAME_HINTS = (
    "liquid",
    "overnight",
    "money market",
    "ultra short",
    "low duration",
    "short duration",
    "medium duration",
    "long duration",
    "corporate bond",
    "credit risk",
    "banking and psu",
    "banking & psu",
    "gilt",
    "government securit",
    "g-sec",
    "debt",
    "bond",
    "income fund",
    "floater",
    "dynamic bond",
)


@dataclass(frozen=True)
class GainsResult:
    gains: list[GainEntry]
    summary: GainSummary
    warnings: list[str]


@dataclass
class _Lot:
    """An unconsumed purchase, with the cost of the units still held in it."""

    acquired: date
    units: Decimal
    cost: Decimal


class _Warnings:
    """Warnings in the order they first arose, without repeats."""

    def __init__(self) -> None:
        self._seen: set[str] = set()
        self.items: list[str] = []

    def add(self, message: str) -> None:
        if message not in self._seen:
            self._seen.add(message)
            self.items.append(message)


def financial_year_bounds(financial_year: str) -> tuple[date, date]:
    """Start and end dates of an Indian financial year written as "2025-26"."""
    match = _FINANCIAL_YEAR.match(financial_year.strip())
    if match is None:
        raise ValueError(f'"{financial_year}" is not a financial year; write it as "2025-26".')
    start_year = int(match.group(1))
    if int(match.group(2)) != (start_year + 1) % 100:
        raise ValueError(f'"{financial_year}" does not name two consecutive years.')
    return date(start_year, 4, 1), date(start_year + 1, 3, 31)


def quarter_of(sale: date, fy_start: date) -> int:
    """Schedule CG table F quarter of a sale, 1 to 5.

    Up to 15 June, 16 June to 15 September, 16 September to 15 December,
    16 December to 15 March, 16 March to 31 March.
    """
    year = fy_start.year
    if sale <= date(year, 6, 15):
        return 1
    if sale <= date(year, 9, 15):
        return 2
    if sale <= date(year, 12, 15):
        return 3
    if sale <= date(year + 1, 3, 15):
        return 4
    return 5


def is_long_term(acquired: date, sold: date, asset_class: AssetClass) -> bool:
    """True when the holding period exceeds 12 months for equity, 24 otherwise.

    The test is *more than*, so a unit bought on 10 April 2024 and sold on
    10 April 2025 is still short term.
    """
    months = EQUITY_LONG_TERM_MONTHS if asset_class == "EQUITY" else OTHER_LONG_TERM_MONTHS
    return sold > _add_months(acquired, months)


def grandfathered_cost(actual_cost: Decimal, sale_value: Decimal, total_fmv: Decimal) -> Decimal:
    """Cost of acquisition under section 55(2)(ac).

    The higher of the actual cost and the lower of the sale value and the
    31 January 2018 fair market value. It can never exceed the sale value, so a
    unit that has fallen since 31 January 2018 cannot manufacture a loss.
    """
    return max(actual_cost, min(sale_value, total_fmv))


def classify_asset(scheme: Scheme) -> AssetClass:
    """Equity-oriented, debt, or neither, for a scheme in the statement.

    Securities transaction tax is only charged on the redemption of an
    equity-oriented scheme, so an STT line anywhere in the scheme settles it.
    Failing that the printed category is used, then the scheme name. When none
    of the three answers, the scheme is OTHER and the caller warns.
    """
    if any(_txn_type(t) == "STT_TAX" for t in scheme.transactions):
        return "EQUITY"

    printed = (scheme.type or "").upper()
    if "EQUITY" in printed:
        return "EQUITY"
    if "DEBT" in printed:
        return "DEBT"

    name = scheme.scheme_name.lower()
    if any(hint in name for hint in DEBT_NAME_HINTS):
        return "DEBT"
    if "elss" in name or "equity" in name or "tax saver" in name:
        return "EQUITY"
    return "OTHER"


def compute_gains(
    folios: list[Folio],
    financial_year: str,
    fmv_31_jan_2018: Mapping[str, float | Decimal] | None = None,
    fund_houses: Mapping[str, str] | None = None,
) -> GainsResult:
    """Realised gains for every sale that falls in the given financial year.

    `fmv_31_jan_2018` maps ISIN to the net asset value on that date, per unit.
    `fund_houses` maps folio number to the asset management company's name.
    Both are optional; what is missing is reported rather than assumed.
    """
    fy_start, fy_end = financial_year_bounds(financial_year)
    fmv = {k.upper(): Decimal(str(v)) for k, v in (fmv_31_jan_2018 or {}).items()}
    houses = fund_houses or {}
    warnings = _Warnings()

    gains: list[GainEntry] = []
    for folio in folios:
        for scheme in folio.schemes:
            gains.extend(
                _scheme_gains(
                    folio=folio,
                    scheme=scheme,
                    fy_start=fy_start,
                    fy_end=fy_end,
                    fmv=fmv,
                    fund_house=houses.get(folio.folio),
                    warnings=warnings,
                )
            )

    gains.sort(key=lambda g: (g.sale_date, g.scheme_name, g.purchase_date))
    return GainsResult(gains=gains, summary=summarise(gains), warnings=warnings.items)


def summarise(gains: list[GainEntry]) -> GainSummary:
    """Roll the legs up into the four heads, Schedule 112A and table F."""
    short_111a = sum(g.gain for g in gains if g.term == "SHORT" and g.asset_class == "EQUITY")
    short_other = sum(g.gain for g in gains if g.term == "SHORT" and g.asset_class != "EQUITY")
    long_112a = sum(g.gain for g in gains if g.term == "LONG" and g.asset_class == "EQUITY")
    long_other = sum(g.gain for g in gains if g.term == "LONG" and g.asset_class != "EQUITY")

    quarterly = {
        "short_term_15": [0, 0, 0, 0, 0],
        "short_term_20": [0, 0, 0, 0, 0],
        "short_term_slab": [0, 0, 0, 0, 0],
        "long_term_10": [0, 0, 0, 0, 0],
        "long_term_125": [0, 0, 0, 0, 0],
        "long_term_20": [0, 0, 0, 0, 0],
    }
    for leg in gains:
        if leg.term == "SHORT":
            # Section 111A is 20 per cent from 23 July 2024; everything else is
            # short term at the slab rate.
            row = "short_term_20" if leg.asset_class == "EQUITY" else "short_term_slab"
        else:
            # Section 112A and section 112 both settle at 12.5 per cent.
            row = "long_term_125"
        quarterly[row][leg.quarter - 1] += leg.gain

    return GainSummary(
        short_term_111A=short_111a,
        short_term_other=short_other,
        long_term_112A=long_112a,
        long_term_other=long_other,
        schedule_112A=[_schedule_112a_row(g) for g in gains if _is_112a(g)],
        quarterly=Quarterly(**quarterly),
    )


# ─────────────────────────── internals ───────────────────────────


def _scheme_gains(
    *,
    folio: Folio,
    scheme: Scheme,
    fy_start: date,
    fy_end: date,
    fmv: Mapping[str, Decimal],
    fund_house: str | None,
    warnings: _Warnings,
) -> list[GainEntry]:
    label = f"{scheme.scheme_name} (folio {folio.folio})"
    asset_class = classify_asset(scheme)
    if asset_class == "OTHER":
        warnings.add(
            f"{label}: the statement does not say whether this scheme is equity oriented, "
            "so the holding period was taken as 24 months and the gain was not treated "
            "as section 111A or 112A. Confirm the category."
        )

    stt_by_date = _stt_by_date(scheme)
    sale_value_by_date = _sale_value_by_date(scheme)
    isin = (scheme.isin or "").upper() or None
    fmv_per_unit = fmv.get(isin) if isin else None

    lots: deque[_Lot] = deque()
    entries: list[GainEntry] = []

    for txn in scheme.transactions:
        units = _dec(txn.units)
        if units == ZERO:
            continue
        kind = _txn_type(txn)
        when = date.fromisoformat(txn.date)

        if units > ZERO:
            if kind not in BUY_TYPES:
                warnings.add(
                    f'{label}: "{txn.description}" added units under an unrecognised '
                    f"transaction type ({kind}); it was treated as a purchase."
                )
            lots.append(_Lot(acquired=when, units=units, cost=_dec(txn.amount).copy_abs()))
            continue

        sold = units.copy_abs()
        if kind in EXEMPT_OUT_TYPES:
            _consume(lots, sold)
            continue
        if kind not in SELL_TYPES:
            warnings.add(
                f'{label}: "{txn.description}" removed units under an unrecognised '
                f"transaction type ({kind}); it was treated as a redemption."
            )

        sale_value = _dec(txn.amount).copy_abs()
        taken = _consume(lots, sold)
        matched = sum((lot_units for _, lot_units, _ in taken), ZERO)
        if matched < sold:
            warnings.add(
                f"{label}: {_units(sold - matched)} units were sold with no matching purchase "
                "in this statement. Their cost is not in the document, so those units were "
                "left out of the gain."
            )
        if matched == ZERO or not (fy_start <= when <= fy_end):
            continue

        stt_for_sale = _allocate(
            stt_by_date.get(when, ZERO), sale_value, sale_value_by_date.get(when, ZERO)
        )
        quarter = quarter_of(when, fy_start)

        for acquired, lot_units, lot_cost in taken:
            share = lot_units / sold
            leg_sale = sale_value * share
            leg_stt = stt_for_sale * share
            long_term = is_long_term(acquired, when, asset_class)
            total_fmv, cost_used = _cost_for_leg(
                asset_class=asset_class,
                long_term=long_term,
                acquired=acquired,
                lot_cost=lot_cost,
                lot_units=lot_units,
                leg_sale=leg_sale,
                fmv_per_unit=fmv_per_unit,
                label=label,
                warnings=warnings,
            )

            sale_rupees = _rupees(leg_sale)
            cost_rupees = _rupees(cost_used)
            entries.append(
                GainEntry(
                    isin=isin,
                    scheme_name=scheme.scheme_name,
                    fund_house=fund_house,
                    asset_class=asset_class,
                    purchase_date=acquired.isoformat(),
                    sale_date=when.isoformat(),
                    units=_units(lot_units),
                    purchase_value=_rupees(lot_cost),
                    sale_value=sale_rupees,
                    fmv_31_jan_2018=None if total_fmv is None else _rupees(total_fmv),
                    cost_used=cost_rupees,
                    expenses=0,
                    stt=_rupees(leg_stt),
                    gain=sale_rupees - cost_rupees,
                    term="LONG" if long_term else "SHORT",
                    quarter=quarter,
                )
            )

    return entries


def _cost_for_leg(
    *,
    asset_class: AssetClass,
    long_term: bool,
    acquired: date,
    lot_cost: Decimal,
    lot_units: Decimal,
    leg_sale: Decimal,
    fmv_per_unit: Decimal | None,
    label: str,
    warnings: _Warnings,
) -> tuple[Decimal | None, Decimal]:
    """Total 31 January 2018 fair market value and the cost to use for one leg."""
    grandfatherable = asset_class == "EQUITY" and long_term and acquired <= GRANDFATHER_DATE
    if not grandfatherable:
        return None, lot_cost
    if fmv_per_unit is None:
        warnings.add(
            f"{label}: units bought on {acquired.isoformat()} were held on 31 January 2018, "
            "but a consolidated account statement does not carry the net asset value for that "
            "date. Section 112A grandfathering was not applied — enter the 31 January 2018 NAV "
            "for this scheme to claim it."
        )
        return None, lot_cost
    total_fmv = fmv_per_unit * lot_units
    return total_fmv, grandfathered_cost(lot_cost, leg_sale, total_fmv)


def _consume(lots: deque[_Lot], units: Decimal) -> list[tuple[date, Decimal, Decimal]]:
    """Take `units` off the front of the queue. Returns (acquired, units, cost)."""
    taken: list[tuple[date, Decimal, Decimal]] = []
    remaining = units
    while remaining > ZERO and lots:
        lot = lots[0]
        if lot.units <= remaining:
            taken.append((lot.acquired, lot.units, lot.cost))
            remaining -= lot.units
            lots.popleft()
            continue
        part_cost = lot.cost * remaining / lot.units
        taken.append((lot.acquired, remaining, part_cost))
        lot.units -= remaining
        lot.cost -= part_cost
        remaining = ZERO
    return taken


def _stt_by_date(scheme: Scheme) -> dict[date, Decimal]:
    totals: dict[date, Decimal] = {}
    for txn in scheme.transactions:
        if _txn_type(txn) != "STT_TAX":
            continue
        when = date.fromisoformat(txn.date)
        totals[when] = totals.get(when, ZERO) + _dec(txn.amount).copy_abs()
    return totals


def _sale_value_by_date(scheme: Scheme) -> dict[date, Decimal]:
    totals: dict[date, Decimal] = {}
    for txn in scheme.transactions:
        if _txn_type(txn) not in SELL_TYPES:
            continue
        when = date.fromisoformat(txn.date)
        totals[when] = totals.get(when, ZERO) + _dec(txn.amount).copy_abs()
    return totals


def _allocate(total: Decimal, part: Decimal, whole: Decimal) -> Decimal:
    """Split a same-day charge across the sales it was charged on, pro rata."""
    if total == ZERO or whole <= ZERO:
        return ZERO
    return total * part / whole


def _is_112a(leg: GainEntry) -> bool:
    return leg.term == "LONG" and leg.asset_class == "EQUITY"


def _schedule_112a_row(leg: GainEntry) -> Schedule112ARow:
    units = Decimal(str(leg.units))
    per_unit = Decimal(leg.sale_value) / units if units > ZERO else ZERO
    fmv_total = leg.fmv_31_jan_2018 or 0
    fmv_per_unit = Decimal(fmv_total) / units if units > ZERO and fmv_total else ZERO
    return Schedule112ARow(
        isin=leg.isin or "",
        scrip_name=leg.scheme_name,
        acquired_before_31_jan_2018=date.fromisoformat(leg.purchase_date) <= GRANDFATHER_DATE,
        units=leg.units,
        sale_price_per_unit=float(round(per_unit, 4)),
        sale_value=leg.sale_value,
        cost_of_acquisition=leg.purchase_value,
        fmv_per_unit_31_jan_2018=float(round(fmv_per_unit, 4)),
        total_fmv=fmv_total,
        expenses=leg.expenses,
        purchase_date=leg.purchase_date,
        sale_date=leg.sale_date,
    )


def _txn_type(txn: Transaction) -> str:
    return (txn.type or "").upper()


def _dec(value: float | int | None) -> Decimal:
    return Decimal(str(value)) if value is not None else ZERO


def _rupees(amount: Decimal) -> int:
    return int(amount.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def _units(amount: Decimal) -> float:
    return float(round(amount, 4))


def _add_months(when: date, months: int) -> date:
    year = when.year + (when.month - 1 + months) // 12
    month = (when.month - 1 + months) % 12 + 1
    return date(year, month, min(when.day, calendar.monthrange(year, month)[1]))
