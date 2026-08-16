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
import { Download } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { SignalDivider } from "@/components/SignalDivider";
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
    <main className="bg-bg text-fg min-h-screen selection:bg-accent/30">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-40 min-h-[80vh] flex flex-col md:grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 md:items-center">
          <div>
            <h1 className="font-mono text-[clamp(1.375rem,5vw+0.5rem,3.75rem)] font-medium leading-[1.05] tracking-tight text-accent md:whitespace-nowrap text-center md:text-left">
              Andrey Adriano da Rosa
            </h1>

            <h2 className="mt-4 text-lg md:text-xl font-normal text-fg-muted max-w-xl mx-auto text-center md:mx-0 md:text-left">
              {dict.home.hero.subtitle}
            </h2>

            {/* No mobile a foto entra aqui embaixo, entre o texto e os
                botões; no desktop essa cópia fica escondida e a outra
                (fora deste bloco) assume a coluna da direita — evita o
                bug de auto-altura do CSS grid ao tentar usar uma foto com
                row-span pra alcançar o mesmo efeito. */}
            <div className="my-8 mx-auto w-[clamp(11rem,18vw,20rem)] md:hidden">
              <Image
                src={`https://github.com/${GITHUB_USERNAME}.png`}
                alt="Andrey Adriano da Rosa"
                width={400}
                height={400}
                className="h-auto w-full rounded-full ring-2 ring-accent/60 ring-offset-4 ring-offset-bg"
                priority
              />
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-5">
              <SignalDivider />
              <a
                href={`/${lang}/resume/pdf`}
                download={`CV_Andrey_Rosa_${lang.toUpperCase()}.pdf`}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover transition-colors"
              >
                <Download size={16} strokeWidth={1.75} />
                {dict.home.hero.ctaResume}
              </a>
            </div>

            <div className="mt-8 flex flex-nowrap items-center justify-center gap-1.5 md:justify-start md:gap-3">
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
          </div>

          <div className="hidden md:block mx-auto w-[clamp(11rem,18vw,20rem)]">
            <Image
              src={`https://github.com/${GITHUB_USERNAME}.png`}
              alt="Andrey Adriano da Rosa"
              width={400}
              height={400}
              className="h-auto w-full rounded-full ring-2 ring-accent/60 ring-offset-4 ring-offset-bg"
              priority
            />
          </div>
        </div>
      </section>

      {/* SOBRE MIM */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <SectionLabel>{dict.home.about.label}</SectionLabel>
          <div className="max-w-2xl space-y-4 text-lg text-fg-subtle leading-relaxed">
            {dict.home.about.text.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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
              <ProjectCard project={project} />
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
