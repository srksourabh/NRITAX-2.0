# NRITAX

File an Indian income tax return — ITR-2 or ITR-3, assessment year 2026-27 — from
anywhere in the world, with most of the figures pulled in for you.

Built for non-resident Indians, who have the hardest version of this problem: an
Indian PAN, income in two countries, no Indian phone to receive an OTP on, and a
31 July deadline in a timezone they are asleep in.

## What it does

1. **Sign in** with an email link or Google. No Indian mobile number needed.
2. **Tell us your PAN, name and date of birth.** We work out whether you file
   ITR-2 or ITR-3 and say why.
3. **Grant consent once.** We pull your pre-fill data, Form 26AS tax credits and
   AIS figures straight from the Income Tax Department through a registered
   e-Return Intermediary, and fill the return with them.
4. **Upload a mutual fund statement** if you have one. We read it, work out your
   capital gains with the 31 January 2018 grandfathering applied, and fill
   Schedule CG and Schedule 112A.
5. **Answer what is left.** Only the questions the pre-fill could not answer.
6. **Choose your regime** from a side-by-side calculation on your own numbers,
   not a rule of thumb.
7. **Validate.** Every Category-A rule the department publishes runs before you
   can upload, plus an AI review that looks for the things a rule cannot see.
8. **File.** We build the departmental JSON and upload it against your PAN.

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
