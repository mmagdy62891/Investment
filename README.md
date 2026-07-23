# Mizan — Halal Investment Scorecard

A web app implementing the Mizan Framework's two-stage halal investment scorecard: search any
ticker, run it through 6 mandatory Shariah/financial gates, then a 100-point weighted score
across 7 categories, rendered in the framework's "Ledger" dark financial-terminal design
(radial gauge, gate cards, category bars, stat chips, EN/AR with full RTL support).

## How the scoring works

- **Stage 1 — Gates** (`server/src/scoring/gates.ts`, `shariah.ts`): Shariah compliance
  (business-activity exclusion list + AAOIFI-style 30%/30%/5% ratio screen), going-concern,
  accounting integrity, liquidity floor, legal/regulatory risk, solvency minimum. Any single
  **FAIL** forces the verdict to REJECT, full stop — no score overrides a failed gate.
- **Stage 2 — Weighted categories** (`server/src/scoring/categories.ts`): Financial Health (20),
  Valuation (20), Growth (15), Moat (15), Governance (10), Macro/Technical (10), Risk (10,
  scored by deduction from 10). Composite 0–100 maps to REJECT / AVOID / WATCH·HOLD /
  BUY·ACCUMULATE / STRONG BUY per the thresholds and colors in the source methodology.
- Category sub-scores that lean on data with no reliable free structured source (moat
  narrative, guidance trend, TAM/backlog) are computed with a best-effort heuristic and flagged
  `estimated` in the UI, rather than asserted with false confidence — matching the framework's
  own stated practice of marking low-confidence determinations instead of guessing silently.

## Data source

The scoring engine takes a `RawFinancials` object (see `server/src/types.ts`) from either
provider:

1. **Financial Modeling Prep (live)** — `server/src/providers/fmp.ts`. Get a free API key at
   <https://site.financialmodelingprep.com/developer/docs>, then set `FMP_API_KEY` in
   `server/.env` (copy `server/.env.example`). Works for any ticker FMP covers.
2. **Bundled demo fixtures** — `server/src/data/fixtures/index.ts`. Used automatically when
   `FMP_API_KEY` is not set, so the app is fully testable out of the box. Includes AAPL, MSFT,
   TSLA, and two precedent cases named directly in the methodology document: **PFE** (fails the
   Shariah gate purely on the 46.7% debt-to-market-cap ratio) and **LMT** (fails the Shariah
   gate purely on business activity — weapons manufacturing — despite a strong financial
   profile). This fixture data is illustrative and approximate, not a live feed.

### Known data-coverage limits (be aware before acting on a live result)

Several gate/category inputs have no reliable free structured-data API and default to a
neutral/no-flag assumption on the **live** FMP path (going-concern qualifications, active
investigations, existential legal risk, short-seller theses, moat classification, board
continuity, non-compliant income share). The app surfaces this explicitly via a warning callout
(`qualitativeDataVerified: false`) rather than silently asserting a clean pass — verify these
independently before acting, the same way the framework itself recommends confirming Shariah
status via a dedicated screening service (Zoya, Musaffa) regardless of what any automated tool
says.

## Running it

```bash
npm install          # installs both workspaces (server, client)
npm run dev           # runs the API (port 8787) and Vite dev server (port 5173) together
```

Open <http://localhost:5173>. Without `FMP_API_KEY` set, use the demo-ticker links shown under
the search bar (AAPL, MSFT, TSLA, PFE, LMT).

To use live data, copy the env template and add your key:

```bash
cp server/.env.example server/.env
# edit server/.env and set FMP_API_KEY=...
```

### Production build

```bash
npm run build   # builds client (client/dist) and server (server/dist)
npm start        # serves the API + built client from one process on $PORT (default 8787)
```

## Project layout

```
server/   Express + TypeScript API
  src/types.ts              shared data contracts (RawFinancials in, Scorecard out)
  src/scoring/               gates.ts, shariah.ts, categories.ts, verdict.ts, index.ts
  src/providers/fmp.ts       live Financial Modeling Prep client
  src/data/fixtures/         bundled demo data
  src/routes/analyze.ts      GET /api/analyze/:ticker, GET /api/demo-tickers

client/   Vite + React + TypeScript UI ("Ledger" theme)
  src/theme.css              color palette, IBM Plex Sans/Mono, RTL rules
  src/components/            RadialGauge, GateCard, CategoryBar, StatChip, CalloutBox,
                              SellTargetBox, PeerTable, VerdictBadge, Scorecard
  src/i18n/                  en/ar dictionaries + fixed-vocabulary label translations
```

## Disclaimer

This is an analytical framework, not financial advice. Shariah compliance determinations
should be independently verified via a dedicated screening service (e.g. Zoya, Musaffa) before
acting on any conclusion produced by this tool.
