import { Router } from "express";
import { fetchRawFinancials, isFmpConfigured } from "../providers/fmp.js";
import { getFixture, DEMO_TICKERS } from "../data/fixtures/index.js";
import { buildScorecard } from "../scoring/index.js";

export const analyzeRouter = Router();

const TICKER_RE = /^[A-Za-z.\-]{1,10}$/;

analyzeRouter.get("/analyze/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  if (!TICKER_RE.test(ticker)) {
    res.status(400).json({ error: "Invalid ticker format." });
    return;
  }

  try {
    if (isFmpConfigured()) {
      const raw = await fetchRawFinancials(ticker);
      if (raw) {
        res.json(buildScorecard(raw, "live"));
        return;
      }
      // Live lookup failed (unknown ticker, or FMP endpoint hiccup) — fall through to demo
      // data if this happens to be one of the bundled demo tickers, otherwise report clearly.
    }

    const fixture = getFixture(ticker);
    if (fixture) {
      res.json(buildScorecard(fixture, "demo"));
      return;
    }

    if (!isFmpConfigured()) {
      res.status(404).json({
        error: "No live data provider configured.",
        detail: `Set FMP_API_KEY to analyze any ticker, or try one of the bundled demo tickers: ${DEMO_TICKERS.join(", ")}.`
      });
      return;
    }

    res.status(404).json({ error: `Could not find data for "${ticker.toUpperCase()}". Check the ticker symbol and try again.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error while analyzing ticker." });
  }
});

analyzeRouter.get("/demo-tickers", (_req, res) => {
  res.json({ tickers: DEMO_TICKERS, liveConfigured: isFmpConfigured() });
});
