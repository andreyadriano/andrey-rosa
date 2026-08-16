// src/app/[lang]/layout.tsx
//
// Layout da rota dinâmica [lang]: valida o segmento de idioma (404 pra
// qualquer coisa fora de pt/en via notFound()), gera metadata por idioma,
// e sincroniza <html lang> no cliente (ver LangSync). generateStaticParams
// aqui vale pra essa página e pra todas as rotas aninhadas futuras
// (projects, blog, resume) — não precisa repetir em cada page.tsx.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, locales } from "@/i18n/config";
import { LangAlternateProvider } from "@/components/LangAlternateContext";
import { LangSync } from "@/components/LangSync";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
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

  return (
    <LangAlternateProvider>
      <LangSync lang={lang} />
      <TopBar lang={lang} />
      {children}
      <Footer lang={lang} />
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
