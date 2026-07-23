import type { Lang } from "../i18n";

export default function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="lang-toggle">
      <button className={lang === "en" ? "active" : ""} onClick={() => onChange("en")}>
        EN
      </button>
      <button className={lang === "ar" ? "active" : ""} onClick={() => onChange("ar")}>
        AR
      </button>
    </div>
  );
}
