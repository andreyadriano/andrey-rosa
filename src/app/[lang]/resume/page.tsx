// src/app/[lang]/resume/page.tsx
//
// Currículo renderizado a partir de @/data/resume.json — a mesma fonte
// usada pelo PDF gerado em /[lang]/resume/pdf (ver route.ts), então página
// e PDF nunca ficam dessincronizados.

import type { Metadata } from "next";
import { Download } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { getDictionary } from "@/i18n/config";
import resumeData from "@/data/resume.json";
import type { Lang, ResumeData } from "@/types";

const resume = resumeData as ResumeData;

interface ResumePageProps {
  params: Promise<{ lang: Lang }>;
}

export default async function ResumePage({ params }: ResumePageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const data = resume[lang];

  return (
    <main className="bg-bg text-fg min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-mono text-4xl md:text-5xl font-medium tracking-tight text-fg">
              {dict.resumePage.title}
            </h1>
            <p className="mt-4 text-lg text-fg-muted max-w-2xl">
              {dict.resumePage.subtitle}
            </p>
          </div>
          <a
            href={`/${lang}/resume/pdf`}
            download
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover transition-colors"
          >
            <Download size={16} strokeWidth={1.75} />
            {dict.resumePage.downloadCta}
          </a>
        </div>

        <div className="mt-12 max-w-3xl">
          <h2 className="font-mono text-2xl text-fg">{data.name}</h2>
          <p className="mt-1 text-accent">{data.role}</p>
          <p className="mt-1 text-sm text-fg-muted">{data.email}</p>
          <p className="mt-5 text-fg-subtle leading-relaxed">{data.summary}</p>

          <div className="mt-12">
            <SectionLabel>{dict.resumePage.sections.experience}</SectionLabel>
            <div className="space-y-6">
              {data.experience.map((item) => (
                <div key={`${item.company}-${item.position}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-mono text-base text-fg">
                      {item.position}
                    </h3>
                    <span className="font-mono text-xs text-fg-muted">
                      {item.period}
                    </span>
                  </div>
                  <p className="text-sm text-fg-muted">{item.company}</p>
                  <p className="mt-2 text-sm text-fg-subtle leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <SectionLabel>{dict.resumePage.sections.education}</SectionLabel>
            <div className="space-y-6">
              {data.education.map((item) => (
                <div key={`${item.institution}-${item.degree}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-mono text-base text-fg">
                      {item.degree}
                    </h3>
                    <span className="font-mono text-xs text-fg-muted">
                      {item.period}
                    </span>
                  </div>
                  <p className="text-sm text-fg-muted">{item.institution}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <SectionLabel>{dict.resumePage.sections.skills}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="font-mono text-[0.6875rem] font-medium px-2 py-0.5 rounded border border-border text-accent-2"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <SectionLabel>{dict.resumePage.sections.languages}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((language) => (
                <span
                  key={language}
                  className="font-mono text-[0.6875rem] font-medium px-2 py-0.5 rounded border border-border text-accent-2"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: ResumePageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.resumePage.title,
    description: dict.resumePage.subtitle,
  };
}
