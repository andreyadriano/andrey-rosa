// src/app/[lang]/page.tsx
//
// Mesma direção visual da versão anterior (paleta terminal-âmbar + sinal-
// teal, tipografia mono, divisor "spectrum analyzer"). Todo texto de UI vem
// do dicionário i18n via getDictionary(lang); dados de conteúdo (projects,
// posts) também são resolvidos por `lang` — nada de texto fixo em PT.
//
// Compatível com output: 'export' (100% estático): generateStaticParams
// pré-renderiza /pt e /en em build time, sem depender de middleware/Edge.
// O redirecionamento de "/" -> "/pt" fica a cargo do Navbar/seletor de
// idioma, não de detecção automática via Accept-Language.

import Image from "next/image";
import Link from "next/link";
import { Download, Terminal as TerminalIcon } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { Reveal } from "@/components/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { PostCard } from "@/components/PostCard";
import { socials } from "@/components/socials";
import { getDictionary } from "@/i18n/config";
import { getFeaturedProjects } from "@/data/projects";
import { getAllPosts } from "@/lib/blog";
import type { Lang } from "@/types";

const GITHUB_USERNAME = "andreyadriano";

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

interface HomePageProps {
  params: Promise<{ lang: Lang }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const projects = getFeaturedProjects(lang, 3);
  const posts = (await getAllPosts(lang)).slice(0, 3);

  return (
    <main className="text-fg min-h-screen selection:bg-accent/30">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 min-h-[85vh] flex flex-col items-center justify-center text-center">
          <h1 className="font-mono text-[clamp(1.75rem,5vw+0.5rem,4rem)] font-medium leading-[1.05] tracking-tight text-accent">
            Andrey Adriano da Rosa
          </h1>

          <h2 className="mt-4 text-lg md:text-2xl font-normal text-fg-muted max-w-xl">
            {dict.home.hero.subtitle}
          </h2>

          <a
            href={`/${lang}/resume/pdf`}
            download={`CV_Andrey_Rosa_${lang.toUpperCase()}.pdf`}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-fg hover:bg-accent-hover transition-colors"
          >
            <Download size={16} strokeWidth={1.75} />
            {dict.home.hero.ctaResume}
          </a>

          <div className="mt-8 flex flex-nowrap items-center justify-center gap-1.5 md:gap-3">
            {socials.map(({ label, href, Icon, className }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={`inline-flex items-center gap-1 md:gap-2 rounded-md border px-2.5 py-1.5 text-xs whitespace-nowrap md:px-4 md:py-2 md:text-sm font-medium transition-colors ${className}`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </a>
            ))}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-fg-muted/80">
            <TerminalIcon size={14} strokeWidth={1.75} className="shrink-0 text-accent-2" />
            {dict.home.hero.terminalHint}
          </p>
        </div>
      </section>

      {/* SOBRE MIM */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <SectionLabel>{dict.home.about.label}</SectionLabel>
          <div className="flex flex-col-reverse md:grid md:grid-cols-[1fr_auto] gap-10 md:gap-12 md:items-center">
            <div className="max-w-2xl space-y-4 text-lg text-fg-subtle leading-relaxed">
              {dict.home.about.text.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mx-auto w-[clamp(9rem,16vw,16rem)] md:mx-0">
              <Image
                src={`https://github.com/${GITHUB_USERNAME}.png`}
                alt="Andrey Adriano da Rosa"
                width={400}
                height={400}
                className="h-auto w-full rounded-full ring-2 ring-accent/60 ring-offset-4 ring-offset-bg"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* PROJETOS EM DESTAQUE */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <Reveal>
          <SectionLabel>{dict.home.projects.label}</SectionLabel>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <Reveal key={project.title} delayMs={i * 80}>
              <ProjectCard project={project} lang={lang} />
            </Reveal>
          ))}
        </div>
        <Link
          href={`/${lang}/projects`}
          className="mt-8 inline-block font-mono text-sm font-medium text-accent-2 hover:text-accent-2-hover underline underline-offset-4 decoration-accent-2/40"
        >
          {dict.home.projects.viewAll} →
        </Link>
      </section>

      {/* ÚLTIMOS POSTS */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <Reveal>
          <SectionLabel>{dict.home.blog.label}</SectionLabel>
        </Reveal>
        <div className="flex flex-col gap-5">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delayMs={i * 80}>
              <PostCard post={post} lang={lang} />
            </Reveal>
          ))}
        </div>
        <Link
          href={`/${lang}/blog`}
          className="mt-8 inline-block font-mono text-sm font-medium text-accent-2 hover:text-accent-2-hover underline underline-offset-4 decoration-accent-2/40"
        >
          {dict.home.blog.viewAll} →
        </Link>
      </section>
    </main>
  );
}
