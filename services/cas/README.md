# CAS parsing service

Reads a CAMS or KFintech consolidated account statement and returns the realised
capital gains for one financial year, in the shape `web/src/lib/cas/types.ts`
calls `CasParseResult`. The web app talks to it through `web/src/lib/cas/client.ts`
and works without it — with the service down, statement upload is disabled and
the wizard falls back to manual capital-gain entry.

## Running it

```
cd services/cas
python -m venv .venv && . .venv/bin/activate     # .venv\Scripts\activate on Windows
pip install -e ".[dev]"
CAS_SERVICE_TOKEN=dev-cas-token uvicorn app.main:app --reload --port 8000
pytest
```

`CAS_SERVICE_TOKEN` is required. The service refuses to start without it, and
compares it against the `X-CAS-Token` header with `hmac.compare_digest` on every
`/parse` call. Set the same value in `web/.env.local`.

## Endpoints

`POST /parse` — multipart with `file` (the statement PDF), `financial_year`
(`"2025-26"`), and `password` when the PDF is encrypted, which it normally is.
Header `X-CAS-Token`. Returns `CasParseResult` on 200 and `CasParseError` on
400, 401, 413 and 500.

`GET /health` — `{ "status": "ok", "casparser_version": "…" }`. No token.

## What it computes

Gains are matched FIFO within a folio and scheme; each purchase lot matched
against a sale becomes one leg. The holding-period split follows the rules for
transfers on or after 23 July 2024: more than 12 months is long term for an
equity-oriented scheme, more than 24 months for anything else. Section 112A
grandfathering uses the cost that section 55(2)(ac) prescribes — the higher of
the actual cost and the lower of the sale value and the 31 January 2018 fair
market value. Every sale is placed in one of the five Schedule CG table F
quarters, and long-term equity legs also come back as scrip-wise Schedule 112A
rows.

Because every sale in the previous year 2025-04-01 to 2026-03-31 falls after
23 July 2024, the 15 per cent short-term row and the 10 and 20 per cent
long-term rows of table F are always zero. They stay in the response because the
departmental schema still carries them.

## What it cannot compute

- **31 January 2018 net asset values.** A consolidated account statement does not
  print them, and `casparser` does not look them up. A long-term equity leg
  bought on or before that date is therefore computed on actual cost, and the
  scheme is named in `warnings`. Nothing is guessed. Supply the values through
  `compute_gains(..., fmv_31_jan_2018={isin: nav})` if you have them.
- **Scheme category, sometimes.** An STT line settles it — securities transaction
  tax is only charged on an equity-oriented scheme. Failing that the printed
  category and then the scheme name are tried. A scheme none of them answer for
  is reported as `OTHER` and named in `warnings`.
- **Units sold that were bought before the statement begins.** They have no cost
  in the document, so they are left out of the gain and named in `warnings`.
- **Transfer expenses.** Not in the statement; always zero. STT is reported
  separately and never deducted — the proviso to section 48 disallows it.
- **Depository statements.** An NSDL or CDSL CAS lists holdings, not
  transactions, so it is rejected with `UNSUPPORTED_FORMAT`. So is a summary
  CAMS or KFintech statement; ask for the detailed one.

## Handling of the file

The PDF is read into memory, parsed from a `BytesIO`, and dropped when the
request ends. It is never written to disk — Starlette's multipart spool limit is
raised past the accepted file size so it cannot roll over to a temporary file.
The PDF, the password and the PAN are never logged; a failed parse logs the
exception type and nothing else.
