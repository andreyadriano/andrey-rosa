// src/components/Footer.tsx
//
// Rodapé compartilhado por todas as rotas /[lang]/* — ver src/app/[lang]/layout.tsx.

import Link from "next/link";
import { getDictionary } from "@/i18n/config";
import { socials } from "@/components/socials";
import type { Lang } from "@/types";

const CONTACT_EMAIL = "andrey.adriano01@hotmail.com";

export async function Footer({ lang }: { lang: Lang }) {
  const dict = await getDictionary(lang);

  const navLinks = [
    { label: dict.nav.home, href: `/${lang}` },
    { label: dict.nav.projects, href: `/${lang}/projects` },
    { label: dict.nav.blog, href: `/${lang}/blog` },
    { label: dict.nav.resume, href: `/${lang}/resume` },
  ];

  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
        <div>
          <p className="font-mono text-sm text-fg">Andrey Adriano da Rosa</p>
          <p className="mt-1 text-xs text-fg-muted max-w-xs">
            {dict.home.hero.subtitle}
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-sm text-fg-muted md:justify-start">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-3">
            {socials
              .filter((social) => social.href.startsWith("http"))
              .map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-fg-muted hover:text-accent transition-colors"
                >
                  <Icon size={18} strokeWidth={1.75} />
                </a>
              ))}
          </div>
          <p className="font-mono text-xs text-fg-muted">
            {dict.footer.contact}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent-2 hover:text-accent-2-hover underline underline-offset-4 decoration-accent-2/40 transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center font-mono text-xs text-fg-muted">
        © {new Date().getFullYear()} Andrey Adriano da Rosa
      </div>
    </footer>
  );
}
