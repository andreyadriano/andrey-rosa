// src/i18n/config.ts
//
// Helper central de i18n. `getDictionary(lang)` faz dynamic import do JSON
// correspondente — assim o bundle de cada rota carrega só o idioma que
// precisa, sem trazer o dicionário inteiro (pt + en) pro client.
//
// Import type Dictionary aqui é inferido do próprio pt.json (source of
// truth), então se um dia esquecer uma chave no en.json, o TypeScript avisa.

import type { Lang } from "@/types";
import type ptDictionary from "./locales/pt.json";

export type Dictionary = typeof ptDictionary;

export const locales: Lang[] = ["pt", "en"];
export const defaultLocale: Lang = "pt";

const dictionaries: Record<Lang, () => Promise<Dictionary>> = {
  pt: () => import("./locales/pt.json").then((mod) => mod.default),
  en: () =>
    import("./locales/en.json").then(
      (mod) => mod.default as unknown as Dictionary,
    ),
};

export async function getDictionary(lang: Lang): Promise<Dictionary> {
  const loader = dictionaries[lang] ?? dictionaries[defaultLocale];
  return loader();
}

export function isValidLocale(lang: string): lang is Lang {
  return (locales as string[]).includes(lang);
}
