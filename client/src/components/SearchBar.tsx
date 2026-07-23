import { useState } from "react";
import type { Dict } from "../i18n/en";

interface Props {
  dict: Dict;
  loading: boolean;
  onSearch: (ticker: string) => void;
  demoTickers: string[];
}

export default function SearchBar({ dict, loading, onSearch, demoTickers }: Props) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form className="search-row" onSubmit={submit} style={{ marginBottom: demoTickers.length ? 6 : 24 }}>
      <input
        className="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={dict.searchPlaceholder}
        maxLength={10}
        autoFocus
      />
      <button className="search-button" type="submit" disabled={loading || !value.trim()}>
        {loading ? "…" : dict.searchButton}
      </button>
    </form>
  );
}
