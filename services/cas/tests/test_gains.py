"""Tests for the FIFO matcher, the grandfathering test and the quarter split."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.gains import (
    classify_asset,
    compute_gains,
    financial_year_bounds,
    grandfathered_cost,
    is_long_term,
    quarter_of,
)
from app.models import Folio, Scheme, Transaction

FY = "2025-26"
FY_START, FY_END = financial_year_bounds(FY)
EQUITY_ISIN = "INF090I01239"


def buy(on: str, units: float, amount: int) -> Transaction:
    return Transaction(
        date=on,
        description="Purchase",
        amount=amount,
        units=units,
        nav=amount / units if units else 0.0,
        balance=0.0,
        type="PURCHASE",
    )


def sell(on: str, units: float, amount: int) -> Transaction:
    return Transaction(
        date=on,
        description="Redemption",
        amount=-amount,
        units=-units,
        nav=amount / units if units else 0.0,
        balance=0.0,
        type="REDEMPTION",
    )


def stt(on: str, amount: int) -> Transaction:
    return Transaction(
        date=on,
        description="STT Paid",
        amount=amount,
        units=0.0,
        nav=0.0,
        balance=0.0,
        type="STT_TAX",
    )


def folio(*transactions: Transaction, name: str = "Specimen Equity Fund - Growth") -> list[Folio]:
    scheme = Scheme(
        scheme_name=name,
        isin=EQUITY_ISIN,
        closing_balance=0.0,
        transactions=list(transactions),
    )
    return [Folio(folio="12345678/90", schemes=[scheme])]


# ─────────────────────────── FIFO ───────────────────────────


def test_fifo_matches_the_oldest_lot_first_and_splits_a_partial_sale():
    """100 units at 10, then 100 at 20; 150 sold at 30."""
    folios = folio(
        buy("2023-05-10", 100, 1000),
        buy("2024-06-10", 100, 2000),
        sell("2025-08-20", 150, 4500),
        stt("2025-08-20", 5),
    )

    result = compute_gains(folios, FY)
    legs = result.gains

    assert len(legs) == 2
    first, second = legs

    assert (first.purchase_date, first.units, first.purchase_value) == ("2023-05-10", 100.0, 1000)
    assert first.sale_value == 3000  # 100 of the 150 units sold
    assert first.gain == 2000

    assert (second.purchase_date, second.units, second.purchase_value) == ("2024-06-10", 50.0, 1000)
    assert second.sale_value == 1500
    assert second.gain == 500

    # Securities transaction tax is reported, never deducted.
    assert first.stt + second.stt == 5
    assert first.gain + second.gain == result.summary.long_term_112A


def test_units_sold_without_a_matching_purchase_are_left_out_and_named():
    folios = folio(buy("2024-05-10", 40, 400), sell("2025-08-20", 100, 2000))

    result = compute_gains(folios, FY)

    assert [leg.units for leg in result.gains] == [40.0]
    assert any("no matching purchase" in w for w in result.warnings)


def test_a_sale_outside_the_financial_year_is_not_reported():
    folios = folio(buy("2023-05-10", 100, 1000), sell("2026-04-15", 100, 3000))

    assert compute_gains(folios, FY).gains == []


# ─────────────────────────── section 112A grandfathering ───────────────────────────


def test_grandfathered_cost_lifts_a_cost_below_the_31_january_2018_value():
    # Bought for 100, worth 250 on 31 January 2018, sold for 400.
    assert grandfathered_cost(Decimal(100), Decimal(400), Decimal(250)) == Decimal(250)


def test_grandfathered_cost_keeps_the_actual_cost_when_it_is_the_higher():
    # Bought for 300, worth 250 on 31 January 2018, sold for 400.
    assert grandfathered_cost(Decimal(300), Decimal(400), Decimal(250)) == Decimal(300)


def test_grandfathered_cost_is_capped_at_the_sale_value():
    # A holding that has fallen since 31 January 2018 cannot manufacture a loss
    # out of the fair market value.
    assert grandfathered_cost(Decimal(100), Decimal(200), Decimal(500)) == Decimal(200)


def test_grandfathering_applies_when_the_31_january_2018_value_is_supplied():
    folios = folio(buy("2016-07-01", 100, 10_000), sell("2025-08-20", 100, 40_000))

    result = compute_gains(folios, FY, fmv_31_jan_2018={EQUITY_ISIN: 250})
    leg = result.gains[0]

    assert leg.term == "LONG"
    assert leg.purchase_value == 10_000
    assert leg.fmv_31_jan_2018 == 25_000
    assert leg.cost_used == 25_000
    assert leg.gain == 15_000

    row = result.summary.schedule_112A[0]
    assert row.acquired_before_31_jan_2018 is True
    assert row.cost_of_acquisition == 10_000  # column 8 is the actual cost
    assert row.fmv_per_unit_31_jan_2018 == 250.0
    assert row.total_fmv == 25_000


def test_a_missing_31_january_2018_value_is_named_rather_than_guessed():
    folios = folio(buy("2016-07-01", 100, 10_000), sell("2025-08-20", 100, 40_000))

    result = compute_gains(folios, FY)
    leg = result.gains[0]

    assert leg.fmv_31_jan_2018 is None
    assert leg.cost_used == 10_000
    assert any("Specimen Equity Fund" in w and "31 January 2018" in w for w in result.warnings)


def test_a_holding_bought_after_31_january_2018_is_not_grandfathered():
    folios = folio(buy("2018-02-01", 100, 10_000), sell("2025-08-20", 100, 40_000))

    leg = compute_gains(folios, FY, fmv_31_jan_2018={EQUITY_ISIN: 250}).gains[0]

    assert leg.fmv_31_jan_2018 is None
    assert leg.cost_used == 10_000


# ─────────────────────────── holding period ───────────────────────────


@pytest.mark.parametrize(
    ("acquired", "sold", "asset_class", "expected"),
    [
        # Equity: more than 12 months.
        ("2024-08-20", "2025-08-20", "EQUITY", False),
        ("2024-08-20", "2025-08-21", "EQUITY", True),
        # Everything else: more than 24 months.
        ("2023-08-20", "2025-08-20", "DEBT", False),
        ("2023-08-20", "2025-08-21", "DEBT", True),
        ("2024-08-20", "2025-08-21", "DEBT", False),
        ("2023-08-20", "2025-08-21", "OTHER", True),
    ],
)
def test_long_term_threshold_is_12_months_for_equity_and_24_otherwise(
    acquired: str, sold: str, asset_class: str, expected: bool
):
    held = is_long_term(date.fromisoformat(acquired), date.fromisoformat(sold), asset_class)
    assert held is expected


def test_the_split_follows_the_scheme_type_end_to_end():
    equity = folio(
        buy("2024-08-20", 100, 10_000),
        sell("2025-08-20", 100, 15_000),
        stt("2025-08-20", 8),
        name="Specimen Equity Fund - Growth",
    )
    debt = folio(
        buy("2024-08-20", 100, 10_000),
        sell("2025-08-20", 100, 15_000),
        name="Specimen Corporate Bond Fund - Growth",
    )

    equity_result = compute_gains(equity, FY)
    debt_result = compute_gains(debt, FY)

    # 12 months to the day is not more than 12 months.
    assert equity_result.gains[0].term == "SHORT"
    assert equity_result.summary.short_term_111A == 5000
    assert equity_result.summary.quarterly.short_term_20[1] == 5000

    assert debt_result.gains[0].term == "SHORT"
    assert debt_result.summary.short_term_other == 5000
    assert debt_result.summary.quarterly.short_term_slab[1] == 5000


def test_a_scheme_that_cannot_be_classified_is_named():
    folios = folio(
        buy("2024-08-20", 100, 10_000),
        sell("2025-08-20", 100, 15_000),
        name="Specimen Balanced Advantage - Growth",
    )

    result = compute_gains(folios, FY)

    assert result.gains[0].asset_class == "OTHER"
    assert any("Balanced Advantage" in w for w in result.warnings)


def test_a_securities_transaction_tax_line_marks_the_scheme_as_equity_oriented():
    scheme = Scheme(
        scheme_name="Specimen Fund - Growth",
        closing_balance=0.0,
        transactions=[buy("2024-08-20", 100, 10_000), stt("2025-08-20", 8)],
    )

    assert classify_asset(scheme) == "EQUITY"


# ─────────────────────────── Schedule CG table F ───────────────────────────


@pytest.mark.parametrize(
    ("sale_date", "expected"),
    [
        ("2025-04-01", 1),
        ("2025-06-15", 1),
        ("2025-06-16", 2),
        ("2025-09-15", 2),
        ("2025-09-16", 3),
        ("2025-12-15", 3),
        ("2025-12-16", 4),
        ("2026-03-15", 4),
        ("2026-03-16", 5),
        ("2026-03-31", 5),
    ],
)
def test_quarter_boundaries(sale_date: str, expected: int):
    assert quarter_of(date.fromisoformat(sale_date), FY_START) == expected


def test_quarterly_grid_carries_each_sale_into_its_own_column():
    folios = folio(
        buy("2020-01-10", 500, 5000),
        sell("2025-06-15", 100, 2000),
        sell("2025-09-16", 100, 2000),
        sell("2025-12-16", 100, 2000),
        sell("2026-03-16", 100, 2000),
        stt("2026-03-16", 2),
    )

    summary = compute_gains(folios, FY).summary

    assert summary.quarterly.long_term_125 == [1000, 0, 1000, 1000, 1000]
    # The pre-23 July 2024 rows stay empty for this previous year.
    assert summary.quarterly.short_term_15 == [0, 0, 0, 0, 0]
    assert summary.quarterly.long_term_10 == [0, 0, 0, 0, 0]
    assert summary.quarterly.long_term_20 == [0, 0, 0, 0, 0]


def test_financial_year_bounds_rejects_a_malformed_year():
    assert financial_year_bounds("2025-26") == (FY_START, FY_END)
    with pytest.raises(ValueError):
        financial_year_bounds("2025-27")
    with pytest.raises(ValueError):
        financial_year_bounds("FY2025")
