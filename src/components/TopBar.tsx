// src/components/TopBar.tsx
//
// Barra fixa no topo das rotas /[lang]/*, compartilhada por todas as
// páginas: links de navegação principais, seletor de idioma e toggle de
// tema.

import Link from "next/link";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";
import { getDictionary } from "@/i18n/config";
import type { Lang } from "@/types";

export async function TopBar({ lang }: { lang: Lang }) {
  const dict = await getDictionary(lang);

  const navLinks = [
    { label: dict.nav.home, href: `/${lang}` },
    { label: dict.nav.projects, href: `/${lang}/projects` },
    { label: dict.nav.blog, href: `/${lang}/blog` },
    { label: dict.nav.resume, href: `/${lang}/resume` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-md">
      <div className="relative max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <MobileMenu navLinks={navLinks} />

        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-sm text-fg-muted hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <LangSwitcher lang={lang} />
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
