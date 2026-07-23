import type { Scorecard as ScorecardData } from "../lib/types";
import type { Dict } from "../i18n/en";
import type { Lang } from "../i18n";
import { GATE_NAMES_AR, CATEGORY_NAMES_AR, VERDICT_LABELS_AR } from "../i18n/labels";
import RadialGauge from "./RadialGauge";
import VerdictBadge from "./VerdictBadge";
import GateGrid from "./GateGrid";
import CategoryBar from "./CategoryBar";
import CalloutBox from "./CalloutBox";
import SellTargetBox from "./SellTargetBox";
import PeerTable from "./PeerTable";

function localizeGates(data: ScorecardData, lang: Lang) {
  if (lang !== "ar") return data.gates;
  return data.gates.map((g) => ({ ...g, name: GATE_NAMES_AR[g.id] ?? g.name }));
}

function localizeCategories(data: ScorecardData, lang: Lang) {
  if (lang !== "ar") return data.categories;
  return data.categories.map((c) => ({ ...c, name: CATEGORY_NAMES_AR[c.id] ?? c.name }));
}

export default function Scorecard({ data, dict, lang }: { data: ScorecardData; dict: Dict; lang: Lang }) {
  const verdictLabel = lang === "ar" ? VERDICT_LABELS_AR[data.verdict] ?? data.verdictLabel : data.verdictLabel;

  return (
    <div>
      {data.callouts.map((c, i) => (
        <CalloutBox callout={c} key={i} />
      ))}

      <div className="panel scorecard-head">
        <div className="scorecard-titles">
          <h2>
            {data.ticker} — {data.companyName}
          </h2>
          <p className="scorecard-sub">
            {data.sector} · {data.industry}
          </p>
          <p className="scorecard-sub">
            {dict.dataAsOf} {new Date(data.asOf).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
            {data.dataSource === "demo" && <span className="estimated-tag"> {dict.demoDataTag}</span>}
          </p>
        </div>
        <div className="scorecard-price mono">
          {data.currency} {data.price.toFixed(2)}
        </div>
      </div>

      <div className="panel" style={{ textAlign: "center" }}>
        <div className="gauge-wrap">
          <RadialGauge score={data.compositeScore} color={data.verdictColor} />
          <VerdictBadge label={verdictLabel} color={data.verdictColor} />
          <p className="scorecard-sub mono">
            {dict.compositeScoreLabel}: {data.compositeScore.toFixed(1)}/100
          </p>
        </div>
      </div>

      <div className="panel">
        <p className="panel-title">{dict.gatesTitle}</p>
        <GateGrid gates={localizeGates(data, lang)} />
      </div>

      <div className="panel">
        <p className="panel-title">{dict.categoriesTitle}</p>
        {localizeCategories(data, lang).map((c) => (
          <CategoryBar category={c} key={c.id} />
        ))}
      </div>

      {data.sellReassessTarget && <SellTargetBox target={data.sellReassessTarget} currency={data.currency} />}

      {data.peers.length > 1 && (
        <div className="panel">
          <p className="panel-title">{dict.peersTitle}</p>
          <PeerTable peers={data.peers} />
        </div>
      )}

      <div className="panel">
        <p className="panel-title">{dict.methodologyTitle}</p>
        <ul className="methodology-notes">
          {data.methodologyNotes.map((n, i) => (
            <li key={i}>— {n}</li>
          ))}
        </ul>
      </div>

      <p className="footer-disclaimer">{dict.disclaimer}</p>
    </div>
  );
}
