"""
Wire models for the CAS parsing service.

Every model here mirrors a type in web/src/lib/cas/types.ts, field for field, in
snake_case. The TypeScript client turns each key into camelCase by upper-casing
the character after an underscore, so the only names allowed here are the ones
that survive that conversion: `short_term_111A` keeps the section number in
capitals because the contract calls the field `shortTerm111A`, and
`fmv_31_jan_2018` becomes `fmv31Jan2018` on its own.

Money is whole rupees. Dates are ISO yyyy-mm-dd.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

CasSource = Literal["CAMS", "KFINTECH", "CDSL", "NSDL", "MFCENTRAL", "UNKNOWN"]
AssetClass = Literal["EQUITY", "DEBT", "OTHER"]
Term = Literal["SHORT", "LONG"]
Quarter = Literal[1, 2, 3, 4, 5]
ErrorCode = Literal["BAD_PASSWORD", "UNSUPPORTED_FORMAT", "SERVICE_UNAVAILABLE", "PARSE_FAILED"]

#: Schedule CG table F has five columns, not four: the last fortnight of March
#: is reported separately because it falls after the final advance-tax date.
Quarters = Annotated[list[int], Field(min_length=5, max_length=5)]


class StatementPeriod(BaseModel):
    """The period the statement covers, not the financial year we compute for."""

    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from")
    to: str


class Investor(BaseModel):
    name: str | None = None
    email: str | None = None
    pan: str | None = None
    address: str | None = None


class Transaction(BaseModel):
    date: str
    description: str
    amount: int
    #: Units and NAV keep their decimals; only money is rounded to the rupee.
    units: float
    nav: float
    #: Unit balance after the transaction, as the statement prints it.
    balance: float
    type: str
    dividend_rate: float | None = None


class Scheme(BaseModel):
    scheme_name: str
    isin: str | None = None
    amfi_code: str | None = None
    advisor: str | None = None
    rta_code: str | None = None
    rta: str | None = None
    #: The scheme category as the statement prints it, when it prints one.
    type: str | None = None
    closing_balance: float
    closing_value: int | None = None
    transactions: list[Transaction] = Field(default_factory=list)


class Folio(BaseModel):
    folio: str
    pan: str | None = None
    kyc: str | None = None
    pan_kyc: str | None = None
    schemes: list[Scheme] = Field(default_factory=list)


class GainEntry(BaseModel):
    """One realised leg: a single purchase lot matched against a single sale."""

    isin: str | None = None
    scheme_name: str
    fund_house: str | None = None
    asset_class: AssetClass
    purchase_date: str
    sale_date: str
    units: float
    #: Actual cost of the units sold, before the section 55(2)(ac) test.
    purchase_value: int
    sale_value: int
    #: Total fair market value of these units on 31 January 2018, when known.
    fmv_31_jan_2018: int | None = None
    cost_used: int
    expenses: int = 0
    #: Securities transaction tax. Reported, never deducted — the proviso to
    #: section 48 disallows it.
    stt: int = 0
    gain: int
    term: Term
    quarter: Quarter


class Schedule112ARow(BaseModel):
    """One scrip-wise row of Schedule 112A.

    `cost_of_acquisition` is column 8, the *actual* cost. The department derives
    column 7, the cost after grandfathering, from this row's FMV columns, so we
    report the input rather than our own answer. `GainEntry.cost_used` carries
    the derived figure for anyone who wants it.
    """

    isin: str
    scrip_name: str
    acquired_before_31_jan_2018: bool
    units: float
    sale_price_per_unit: float
    sale_value: int
    cost_of_acquisition: int
    fmv_per_unit_31_jan_2018: float
    total_fmv: int
    expenses: int
    purchase_date: str | None = None
    sale_date: str | None = None


class Quarterly(BaseModel):
    """Schedule CG table F, one row per rate, five quarters each.

    The 15 per cent, 10 per cent and 20 per cent rows exist because the schema
    still carries them for transfers made before 23 July 2024. Every sale in the
    previous year 2025-04-01 to 2026-03-31 falls after that date, so this service
    leaves those three rows at zero.
    """

    short_term_15: Quarters
    short_term_20: Quarters
    short_term_slab: Quarters
    long_term_10: Quarters
    long_term_125: Quarters
    long_term_20: Quarters


class GainSummary(BaseModel):
    short_term_111A: int
    short_term_other: int
    long_term_112A: int
    long_term_other: int
    schedule_112A: list[Schedule112ARow] = Field(default_factory=list)
    quarterly: Quarterly


class ParseResult(BaseModel):
    ok: Literal[True] = True
    source: CasSource
    statement_period: StatementPeriod
    investor: Investor
    folios: list[Folio]
    gains: list[GainEntry]
    summary: GainSummary
    warnings: list[str] = Field(default_factory=list)


class ParseError(BaseModel):
    ok: Literal[False] = False
    code: ErrorCode
    message: str
