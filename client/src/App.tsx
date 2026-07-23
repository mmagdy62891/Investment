import { useEffect, useState } from "react";
import type { Scorecard as ScorecardData } from "./lib/types";
import { useDict, type Lang } from "./i18n";
import SearchBar from "./components/SearchBar";
import LanguageToggle from "./components/LanguageToggle";
import Scorecard from "./components/Scorecard";

interface ApiError {
  error: string;
  detail?: string;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [demoTickers, setDemoTickers] = useState<string[]>([]);

  const dict = useDict(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    fetch("/api/demo-tickers")
      .then((r) => r.json())
      .then((d) => setDemoTickers(d.tickers ?? []))
      .catch(() => {});
  }, []);

  async function runSearch(symbol: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/${encodeURIComponent(symbol)}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body as ApiError);
        setData(null);
      } else {
        setData(body as ScorecardData);
      }
    } catch {
      setError({ error: "Network error reaching the analysis API." });
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="brand">
          <span className="brand-kicker">{dict.brandKicker}</span>
          <h1 className="brand-title">{dict.brandTitle}</h1>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      <SearchBar dict={dict} loading={loading} onSearch={runSearch} demoTickers={demoTickers} />

      {demoTickers.length > 0 && (
        <p className="demo-hint">
          {dict.demoHintPrefix}{" "}
          {demoTickers.map((t) => (
            <button key={t} onClick={() => runSearch(t)}>
              {t}
            </button>
          ))}
        </p>
      )}

      {loading && <div className="state-box">{dict.loading}</div>}

      {!loading && error && (
        <div className="state-box error">
          <strong>{dict.errorTitle}</strong>
          <p>{error.detail ?? error.error}</p>
        </div>
      )}

      {!loading && !error && !data && <div className="state-box">{dict.emptyState}</div>}

      {!loading && !error && data && <Scorecard data={data} dict={dict} lang={lang} />}
    </div>
  );
}
