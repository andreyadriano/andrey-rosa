// src/app/[lang]/layout.tsx
//
// Layout da rota dinâmica [lang]: valida o segmento de idioma (404 pra
// qualquer coisa fora de pt/en via notFound()), gera metadata por idioma,
// e sincroniza <html lang> no cliente (ver LangSync). generateStaticParams
// aqui vale pra essa página e pra todas as rotas aninhadas futuras
// (projects, blog, resume) — não precisa repetir em cada page.tsx.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isValidLocale, locales } from "@/i18n/config";
import { LangAlternateProvider } from "@/components/LangAlternateContext";
import { LangSync } from "@/components/LangSync";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { WindowManagerProvider } from "@/components/window/WindowManagerContext";
import { Taskbar } from "@/components/window/Taskbar";
import { TerminalApp } from "@/components/apps/Terminal";
import { buildFileSystem } from "@/lib/vfs/build";
import resumeData from "@/data/resume.json";
import type { Lang, ResumeData } from "@/types";

const resume = resumeData as ResumeData;

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const { lang } = await params;

  if (!isValidLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);
  const terminal = dict.home.hero.terminal;
  const terminalRows = [
    { label: terminal.labels.name, value: "Andrey Adriano da Rosa" },
    { label: terminal.labels.role, value: dict.home.hero.subtitle },
    { label: terminal.labels.focus, value: terminal.focus },
    { label: terminal.labels.experience, value: terminal.experience },
    { label: terminal.labels.stack, value: terminal.stack },
    { label: terminal.labels.location, value: terminal.location },
    {
      label: terminal.labels.status,
      value: (
        <span className="inline-flex items-center gap-1.5 text-accent">
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
            aria-hidden="true"
          />
          {dict.home.hero.availability}
        </span>
      ),
    },
  ];
  const fileSystem = buildFileSystem(lang);

  return (
    <LangAlternateProvider>
      <LangSync lang={lang} />
      <TopBar lang={lang} />
      {children}
      <Footer lang={lang} />
      <WindowManagerProvider>
        <TerminalApp
          prompt={terminal.prompt}
          bootCommand={terminal.command}
          bootLines={terminal.boot}
          rows={terminalRows}
          fs={fileSystem}
          help={terminal.help}
        />
        <Taskbar />
      </WindowManagerProvider>
    </LangAlternateProvider>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) {
    return {};
  }

  const { name, role, summary } = resume[lang];

  return {
    title: `${name} — ${role}`,
    description: summary,
  };
}

export async function generateStaticParams() {
  return locales.map((lang: Lang) => ({ lang }));
}
