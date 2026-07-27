"""
The casparser wrapper.

`casparser.read_cas_pdf` takes a file-like object, so the statement is read from
a BytesIO over the request body and never reaches the filesystem. This module
turns casparser's models into the wire models in models.py and turns its
exceptions into the four error codes the contract allows.
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from casparser import CASData, read_cas_pdf
from casparser import types as cas
from casparser.enums import CASFileType
from casparser.exceptions import (
    CASParseError,
    HeaderParseError,
    IncompleteCASError,
    IncorrectPasswordError,
    ParserException,
)

from .models import CasSource, ErrorCode, Folio, Investor, Scheme, StatementPeriod, Transaction


class CasFailure(Exception):
    """A parse that failed in a way the taxpayer can act on."""

    def __init__(self, code: ErrorCode, message: str) -> None:
        super().__init__(message)
        self.code: ErrorCode = code
        self.message = message


@dataclass(frozen=True)
class Statement:
    source: CasSource
    period: StatementPeriod
    investor: Investor
    folios: list[Folio]
    #: Folio number to asset management company, which the gain legs carry but
    #: CasFolio has no room for.
    fund_houses: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def parse_statement(pdf: bytes, password: str | None) -> Statement:
    """Read a CAMS or KFintech consolidated account statement held in memory."""
    if not pdf.startswith(b"%PDF-"):
        raise CasFailure("UNSUPPORTED_FORMAT", "That file is not a PDF.")

    try:
        data = read_cas_pdf(io.BytesIO(pdf), password or "", output="dict", sort_transactions=True)
    except IncorrectPasswordError as exc:
        raise CasFailure(
            "BAD_PASSWORD",
            "The statement did not open with that password. CAMS and KFintech encrypt it "
            "with the PAN in capitals, or with the password you chose when you asked for it.",
        ) from exc
    except IncompleteCASError as exc:
        raise CasFailure(
            "UNSUPPORTED_FORMAT",
            "This statement is missing pages. Ask for it again and upload the whole file.",
        ) from exc
    except (HeaderParseError, CASParseError) as exc:
        raise CasFailure(
            "UNSUPPORTED_FORMAT",
            "This does not look like a CAMS or KFintech consolidated account statement.",
        ) from exc
    except ParserException as exc:
        raise CasFailure("PARSE_FAILED", "The statement could not be read.") from exc

    if not isinstance(data, CASData):
        raise CasFailure(
            "UNSUPPORTED_FORMAT",
            "This is a depository (NSDL or CDSL) statement. It lists holdings but not the "
            "transactions a capital gain is computed from — upload the CAMS or KFintech "
            "mutual fund statement instead.",
        )
    if data.cas_type is not CASFileType.DETAILED:
        raise CasFailure(
            "UNSUPPORTED_FORMAT",
            "This is a summary statement. Ask CAMS or KFintech for the detailed statement, "
            "which lists every transaction.",
        )

    folios = [_folio(f) for f in data.folios]
    fund_houses = {f.folio: f.amc for f in data.folios if f.amc}
    pan = next((f.PAN for f in data.folios if f.PAN), None)

    return Statement(
        source=_source(data.file_type),
        period=StatementPeriod(from_=data.statement_period.from_, to=data.statement_period.to),
        investor=Investor(
            name=data.investor_info.name or None,
            email=data.investor_info.email or None,
            pan=pan,
            address=data.investor_info.address or None,
        ),
        folios=folios,
        fund_houses=fund_houses,
        warnings=list(data.parse_warnings or []),
    )


# ─────────────────────────── internals ───────────────────────────


def _source(file_type: object) -> CasSource:
    name = _name(file_type)
    return name if name in ("CAMS", "KFINTECH", "CDSL", "NSDL", "MFCENTRAL") else "UNKNOWN"


def _folio(folio: cas.Folio) -> Folio:
    return Folio(
        folio=folio.folio,
        pan=folio.PAN or None,
        kyc=folio.KYC or None,
        pan_kyc=folio.PANKYC or None,
        schemes=[_scheme(s) for s in folio.schemes],
    )


def _scheme(scheme: cas.Scheme) -> Scheme:
    return Scheme(
        scheme_name=scheme.scheme,
        isin=scheme.isin or None,
        amfi_code=scheme.amfi or None,
        advisor=scheme.advisor or None,
        rta_code=scheme.rta_code or None,
        rta=scheme.rta or None,
        type=scheme.type or None,
        closing_balance=_units(scheme.close),
        closing_value=_rupees(scheme.valuation.value),
        transactions=[_transaction(t) for t in scheme.transactions],
    )


def _transaction(txn: cas.TransactionData) -> Transaction:
    return Transaction(
        date=_iso(txn.date),
        description=txn.description,
        amount=_rupees(txn.amount),
        units=_units(txn.units),
        nav=_units(txn.nav),
        balance=_units(txn.balance),
        type=_name(txn.type),
        dividend_rate=None if txn.dividend_rate is None else float(txn.dividend_rate),
    )


def _name(value: object) -> str:
    """Enum member name, or the string itself when casparser hands back a string."""
    return str(getattr(value, "name", value) or "").upper()


def _iso(value: object) -> str:
    if isinstance(value, date):
        return value.isoformat()
    return date.fromisoformat(str(value)).isoformat()


def _rupees(value: object) -> int:
    if value is None:
        return 0
    return int(Decimal(str(value)).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def _units(value: object) -> float:
    if value is None:
        return 0.0
    return float(round(Decimal(str(value)), 4))
