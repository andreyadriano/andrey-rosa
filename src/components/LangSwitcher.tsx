// src/components/LangSwitcher.tsx
//
// Mostra os dois idiomas lado a lado (PT | EN); o idioma ativo fica
// destacado em accent, o outro é um link pro mesmo caminho no outro idioma
// (ex.: /pt/projects -> /en/projects). Quando a página atual registra um
// caminho alternativo via LangAlternateContext (ex.: slugs de blog que
// divergem por tradução), usamos esse caminho em vez da troca ingênua.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLangAlternatePath } from "@/components/LangAlternateContext";
import { locales } from "@/i18n/config";
import type { Lang } from "@/types";

export function LangSwitcher({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const alternatePath = useLangAlternatePath();

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-border-strong">|</span>}
          {l === lang ? (
            <span className="text-accent" aria-current="true">
              {l}
            </span>
          ) : (
            <Link
              href={alternatePath ?? pathname.replace(`/${lang}`, `/${l}`)}
              className="text-fg-muted hover:text-accent transition-colors"
            >
              {l}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
