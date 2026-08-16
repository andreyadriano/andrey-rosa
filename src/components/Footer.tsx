// src/components/Footer.tsx
//
// Rodapé compartilhado por todas as rotas /[lang]/* — ver src/app/[lang]/layout.tsx.

import { getDictionary } from "@/i18n/config";
import type { Lang } from "@/types";

const CONTACT_EMAIL = "andrey.adriano01@hotmail.com";

export async function Footer({ lang }: { lang: Lang }) {
  const dict = await getDictionary(lang);

  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <p className="font-mono text-sm text-fg-muted">
          {dict.footer.contact}{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent-2 hover:text-accent-2-hover underline underline-offset-4 decoration-accent-2/40 transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
