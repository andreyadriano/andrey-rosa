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
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon, GITHUB_LINK_CLASSNAME } from "@/components/icons";
import { SectionLabel } from "@/components/SectionLabel";
import { SignalDivider } from "@/components/SignalDivider";
import { ProjectCard } from "@/components/ProjectCard";
import { PostCard } from "@/components/PostCard";
import { getDictionary } from "@/i18n/config";
import { getFeaturedProjects } from "@/data/projects";
import { getAllPosts } from "@/lib/blog";
import type { Lang } from "@/types";

const GITHUB_USERNAME = "andreyadriano";

const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/andrey-adriano-da-rosa",
    Icon: LinkedinIcon,
    className:
      "border-[#0a66c2]/50 text-[#0a66c2] hover:bg-[#0a66c2] hover:text-white hover:border-[#0a66c2]",
  },
  {
    label: "GitHub",
    href: "https://github.com/andreyadriano",
    Icon: GithubIcon,
    className: GITHUB_LINK_CLASSNAME,
  },
  {
    label: "E-mail",
    href: "mailto:andrey.adriano01@hotmail.com",
    Icon: Mail,
    className:
      "border-accent/50 text-accent hover:bg-accent hover:text-accent-fg hover:border-accent",
  },
];

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
            <h1 className="font-mono text-[clamp(1.375rem,5vw+0.5rem,3.75rem)] font-medium leading-[1.05] tracking-tight text-fg whitespace-nowrap text-center md:text-left">
              {dict.home.hero.greeting}{" "}
              <span className="text-accent">Andrey</span>!
            </h1>

            <p className="mt-4 text-lg md:text-xl text-fg-muted max-w-xl mx-auto text-center md:mx-0 md:text-left">
              {dict.home.hero.subtitle}
            </p>

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

            <div className="flex flex-col items-center gap-4 md:mt-3 md:flex-row md:items-center md:justify-start">
              <SignalDivider />
              <a
                href={`/${lang}/resume/pdf`}
                download={`CV_Andrey_Rosa_${lang.toUpperCase()}.pdf`}
                className="font-mono text-sm font-medium text-accent-2 hover:text-accent-2-hover transition-colors underline underline-offset-4 decoration-accent-2/40"
              >
                {dict.home.hero.ctaResume} ↓
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
        <SectionLabel>{dict.home.about.label}</SectionLabel>
        <div className="max-w-2xl space-y-4 text-lg text-fg-subtle leading-relaxed">
          {dict.home.about.text.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* PROJETOS EM DESTAQUE */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <SectionLabel>{dict.home.projects.label}</SectionLabel>
        <div className="grid md:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
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
        <SectionLabel>{dict.home.blog.label}</SectionLabel>
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} lang={lang} />
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
