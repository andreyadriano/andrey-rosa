// src/app/[lang]/blog/[slug]/page.tsx
//
// Renderiza um post do blog a partir de src/content/blog/{lang}/{slug}.mdx.
// Um único import dinâmico traz tanto o `metadata` exportado quanto o
// componente MDX compilado — ver src/mdx-components.tsx pro mapeamento de
// estilo das tags.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SetLangAlternate } from "@/components/LangAlternateContext";
import { getDictionary, isValidLocale, locales } from "@/i18n/config";
import { getPostSlugs, getReadingTime } from "@/lib/blog";
import type { Lang } from "@/types";

interface PostPageProps {
  params: Promise<{ lang: Lang; slug: string }>;
}

interface PostModule {
  default: React.ComponentType;
  metadata: {
    title: string;
    summary: string;
    date: string;
    translations?: Partial<Record<Lang, string>>;
  };
}

const READING_TIME_LABEL: Record<Lang, (minutes: number) => string> = {
  pt: (minutes) => `${minutes} min de leitura`,
  en: (minutes) => `${minutes} min read`,
};

async function loadPost(lang: Lang, slug: string): Promise<PostModule | null> {
  try {
    return (await import(`@/content/blog/${lang}/${slug}.mdx`)) as PostModule;
  } catch {
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slug } = await params;
  const dict = await getDictionary(lang);
  const mod = await loadPost(lang, slug);

  if (!mod) {
    notFound();
  }

  const { default: PostContent, metadata } = mod;
  const dateLocale = lang === "pt" ? "pt-BR" : "en-US";
  const otherLang = locales.find((l) => l !== lang);
  const translatedSlug = otherLang && metadata.translations?.[otherLang];
  const alternatePath = otherLang
    ? translatedSlug
      ? `/${otherLang}/blog/${translatedSlug}`
      : `/${otherLang}/blog`
    : null;

  return (
    <main className="text-fg min-h-screen">
      {alternatePath && <SetLangAlternate path={alternatePath} />}
      <article className="max-w-3xl mx-auto px-6 py-20">
        <Link
          href={`/${lang}/blog`}
          className="font-mono text-sm text-accent-2 hover:text-accent-2-hover transition-colors"
        >
          {dict.blogPage.back}
        </Link>

        <div className="mt-6 flex items-center gap-2 font-mono text-xs text-fg-muted">
          <time>
            {new Date(metadata.date).toLocaleDateString(dateLocale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </time>
          <span aria-hidden="true">·</span>
          <span>{READING_TIME_LABEL[lang](getReadingTime(lang, slug))}</span>
        </div>

        <h1 className="mt-3 font-mono text-3xl md:text-4xl font-medium tracking-tight text-fg">
          {metadata.title}
        </h1>

        <div className="mt-10">
          <PostContent />
        </div>
      </article>
    </main>
  );
}

export async function generateStaticParams({
  params,
}: {
  params: { lang: string };
}) {
  if (!isValidLocale(params.lang)) return [];
  return getPostSlugs(params.lang).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const mod = await loadPost(lang, slug);

  if (!mod) return {};

  return {
    title: mod.metadata.title,
    description: mod.metadata.summary,
  };
}
