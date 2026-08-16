// src/components/LangSync.tsx
//
// O único <html> da árvore vive em src/app/layout.tsx, acima da rota
// dinâmica [lang] — então ele não sabe se a página atual é /pt ou /en e
// fica travado no defaultLocale. Como o build é 100% estático
// (output: 'export', sem middleware/servidor pra reescrever o HTML por
// request), corrigimos o atributo lang no cliente logo na montagem. Client
// components rodam antes do "paint" gerenciado pelo React, então isso não
// causa flash perceptível — é só o marcador de acessibilidade/SEO que fica
// correto assim que o JS carrega.

"use client";

import { useEffect } from "react";
import type { Lang } from "@/types";

export function LangSync({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
