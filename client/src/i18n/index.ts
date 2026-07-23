import { en } from "./en";
import { ar } from "./ar";

export type Lang = "en" | "ar";

export const dictionaries = { en, ar };

export function useDict(lang: Lang) {
  return dictionaries[lang];
}
