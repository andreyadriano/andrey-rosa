// src/app/[lang]/projects/page.tsx
//
// Listagem completa de projetos. Reaproveita o mesmo ProjectCard e os
// mesmos dados mockados (@/data/projects) usados na seção "Projetos em
// destaque" da home.

import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { getDictionary } from "@/i18n/config";
import { projectsByLang } from "@/data/projects";
import type { Lang } from "@/types";

interface ProjectsPageProps {
  params: Promise<{ lang: Lang }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const projects = projectsByLang[lang];

  return (
    <main className="bg-bg text-fg min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Link
          href={`/${lang}`}
          className="font-mono text-sm text-accent-2 hover:text-accent-2-hover transition-colors"
        >
          {dict.common.backHome}
        </Link>

        <h1 className="mt-6 font-mono text-4xl md:text-5xl font-medium tracking-tight text-fg">
          {dict.projectsPage.title}
        </h1>
        <p className="mt-4 text-lg text-fg-muted max-w-2xl">
          {dict.projectsPage.subtitle}
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: ProjectsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.projectsPage.title,
    description: dict.projectsPage.subtitle,
  };
}
