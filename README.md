# NRITAX

File an Indian income tax return — ITR-2 or ITR-3, assessment year 2026-27 — from
anywhere in the world, with most of the figures pulled in for you.

Built for non-resident Indians, who have the hardest version of this problem: an
Indian PAN, income in two countries, no Indian phone to receive an OTP on, and a
31 July deadline in a timezone they are asleep in.

## What it does

1. **Sign in** with an email link or Google. No Indian mobile number needed.
2. **Choose ITR-2 or ITR-3.** Each form is a separate fillable track with its
   own schedules, calculations, validations and mandatory fields.
3. **Prefill and helpers are optional.** Upload ITD prefill JSON, use Sandbox /
   DigiLocker, or enter Part A by hand — nothing blocks the wizard.
4. **Upload a Detailed mutual fund CAS** if you have one (CAMS / KFintech). The
   free open-source parser fills Schedule CG and Schedule 112A; the PDF password
   defaults to your PAN.
5. **Complete what is left** on the chosen track.
6. **Validate** with that form's CBDT rules.
7. **Download the departmental JSON** and upload it on the Income Tax portal
   yourself (Phase 1). Live ERI filing comes later.

## What it deliberately does not do

- **It never asks for your Income Tax portal password.** The e-Return
  Intermediary route does not need it, and holding it would put your entire tax
  history one breach away. If any screen ever asks you for it, that screen is a
  bug — report it.
- It does not give tax advice. It does arithmetic on the figures you supply and
  shows you the rules that apply.
- It is not affiliated with or endorsed by the Income Tax Department.

## Running it

```bash
npm run install:all
cp .env.example web/.env.local     # the defaults give you a working offline demo
npm run dev                        # http://localhost:3000
```

With the shipped defaults you get a complete, working filing flow offline: an
embedded database (no Postgres install), a mock ERI provider returning realistic
specimen data, and a sign-in link printed to your terminal instead of emailed.

To parse real mutual fund statements you also need the Python service:

```bash
cd services/cas && pip install -e . && uvicorn app.main:app --port 8000
```

Or bring the whole stack up in containers:

```bash
AUTH_SECRET=$(openssl rand -base64 32) docker compose up
```

## Going live

Three things have to be real before a single return is filed:

| What | Why |
| --- | --- |
| `ERI_SOFTWARE_ID` | Your registered departmental software identifier. The validator refuses to pass while it is the placeholder, because Category-A blacklisting attaches to that number. |
| `ERI_PROVIDER` and its credentials | Either your own Type-2 ERI registration, or a licensed provider. Until then everything runs against the mock. |
| `DATABASE_URL` | The embedded database is a development convenience. Production needs real Postgres with backups. |

## Layout

```
web/                    The app. Next.js, TypeScript, installable as a PWA.
  src/lib/itr/          Form schema, CBDT validation rules, tax computation, JSON builder.
  src/lib/eri/          Portal integration behind one swappable interface.
  src/lib/cas/          Client for the statement parser.
  src/lib/ai/           The AI review pass.
services/cas/           Python service that reads CAMS and KFintech statements.
docs/CONTRACTS.md       The rules every contributor and agent follows.
docs/reference/         The two HTML prototypes this was ported from.
```

## Checks

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## Handling your data

Your PAN, Aadhaar and bank details are stored so you can come back to a
half-finished return, and are never written to application logs. Uploaded
statements are parsed in memory and discarded — the PDF is never saved. The AI
review runs on a redacted copy with identifiers replaced by placeholders.
