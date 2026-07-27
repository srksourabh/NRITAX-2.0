"""
The CAS parsing service.

Two endpoints. POST /parse takes the statement PDF and returns the shape
web/src/lib/cas/types.ts calls CasParseResult; GET /health says whether the
service and casparser are up.

The PDF is held in memory for the length of one request and is never written to
disk, never logged, and never returned. Neither is the password.
"""

from __future__ import annotations

import hmac
import logging
import os
from importlib.metadata import version
from typing import Annotated

from fastapi import FastAPI, File, Form, Header, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.formparsers import MultiPartParser

from .gains import compute_gains, financial_year_bounds
from .models import ParseError, ParseResult
from .parser import CasFailure, parse_statement

logger = logging.getLogger("cas")

#: A consolidated account statement for a long investing history runs to a few
#: megabytes. Anything past this is not one.
MAX_PDF_BYTES = 20 * 1024 * 1024

#: Starlette spools a multipart file part to a temporary file once it grows past
#: this. The contract forbids putting the statement on disk, so the spool has to
#: hold the largest file we accept.
MultiPartParser.spool_max_size = MAX_PDF_BYTES + 1024 * 1024


def _require_token() -> str:
    token = os.environ.get("CAS_SERVICE_TOKEN", "").strip()
    if not token:
        raise RuntimeError(
            "CAS_SERVICE_TOKEN is not set. The parsing service handles statements and will "
            "not start without the shared secret the web app calls it with."
        )
    return token


SERVICE_TOKEN = _require_token()
CASPARSER_VERSION = version("casparser")

app = FastAPI(title="NRITAX CAS parser", version="0.1.0", docs_url=None, redoc_url=None)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness for the web app's cached probe and for the container check."""
    return {"status": "ok", "casparser_version": CASPARSER_VERSION}


@app.post("/parse")
async def parse(
    file: Annotated[UploadFile, File()],
    financial_year: Annotated[str, Form()],
    password: Annotated[str | None, Form()] = None,
    x_cas_token: Annotated[str | None, Header(alias="X-CAS-Token")] = None,
) -> JSONResponse:
    """Parse a statement and return its realised gains for one financial year."""
    if not _authorised(x_cas_token):
        # Not one of the parse failures, but from the web app's side the service
        # is unusable, and the fallback is the same: manual capital-gain entry.
        return _json(
            ParseError(
                code="SERVICE_UNAVAILABLE",
                message="X-CAS-Token does not match the service token.",
            ),
            401,
        )

    try:
        financial_year_bounds(financial_year)
    except ValueError as exc:
        return _json(ParseError(code="PARSE_FAILED", message=str(exc)), 400)

    pdf = await file.read()
    await file.close()
    try:
        if not pdf:
            return _json(ParseError(code="UNSUPPORTED_FORMAT", message="The file was empty."), 400)
        if len(pdf) > MAX_PDF_BYTES:
            return _json(
                ParseError(
                    code="UNSUPPORTED_FORMAT",
                    message=f"The file is larger than {MAX_PDF_BYTES // (1024 * 1024)} MB.",
                ),
                413,
            )
        try:
            statement = await run_in_threadpool(parse_statement, pdf, password)
        except CasFailure as exc:
            return _json(ParseError(code=exc.code, message=exc.message), 400)
        except Exception as exc:
            # The exception type only. A casparser message can quote the PDF, and
            # the password is usually the PAN.
            logger.error("CAS parse failed: %s", type(exc).__name__)
            return _json(
                ParseError(
                    code="PARSE_FAILED",
                    message="The statement could not be read. Try the detailed statement "
                    "from CAMS or KFintech, or enter the gains by hand.",
                ),
                500,
            )
    finally:
        del pdf

    result = compute_gains(
        statement.folios,
        financial_year,
        fund_houses=statement.fund_houses,
    )
    return _json(
        ParseResult(
            source=statement.source,
            statement_period=statement.period,
            investor=statement.investor,
            folios=statement.folios,
            gains=result.gains,
            summary=result.summary,
            warnings=[*statement.warnings, *result.warnings],
        )
    )


def _authorised(token: str | None) -> bool:
    return bool(token) and hmac.compare_digest(token or "", SERVICE_TOKEN)


def _json(payload: BaseModel, status: int = 200) -> JSONResponse:
    return JSONResponse(status_code=status, content=payload.model_dump(by_alias=True, mode="json"))
