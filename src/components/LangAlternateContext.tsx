// src/components/LangAlternateContext.tsx
//
// Nem toda página tem o mesmo caminho nos dois idiomas — um post do blog
// pode ter slugs diferentes por tradução (ex.: /pt/blog/nextjs-mdx-sem-cms
// vs /en/blog/nextjs-mdx-no-cms). O LangSwitcher, por padrão, só troca o
// segmento de idioma no caminho atual, o que quebra (404) nesses casos.
// Esse contexto deixa uma página registrar o caminho correto no outro
// idioma; sem registro, o LangSwitcher cai de volta pra troca ingênua.

"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LangAlternateContext = createContext<{
  path: string | null;
  setPath: (path: string | null) => void;
} | null>(null);

export function LangAlternateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [path, setPath] = useState<string | null>(null);

  return (
    <LangAlternateContext.Provider value={{ path, setPath }}>
      {children}
    </LangAlternateContext.Provider>
  );
}

export function useLangAlternatePath(): string | null {
  const ctx = useContext(LangAlternateContext);
  return ctx?.path ?? null;
}

export function SetLangAlternate({ path }: { path: string }) {
  const ctx = useContext(LangAlternateContext);

  useEffect(() => {
    ctx?.setPath(path);
    return () => ctx?.setPath(null);
  }, [path, ctx]);

  return null;
}
