// src/components/MobileMenu.tsx
//
// Menu hamburguer pra telas pequenas — os links de navegação da TopBar
// (Início/Projetos/Blog/Currículo) ficam escondidos atrás desse botão em
// vez de disputar espaço com o seletor de idioma e o toggle de tema, que
// continuam sempre visíveis.

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

export function MobileMenu({ navLinks }: { navLinks: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-fg-muted hover:text-accent hover:border-accent/40 transition-colors"
      >
        {open ? (
          <X size={18} strokeWidth={1.75} />
        ) : (
          <Menu size={18} strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-14 border-b border-border bg-bg px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-mono text-sm text-fg-muted hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
