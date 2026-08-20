// src/app/[lang]/blog/page.tsx
//
// Listagem completa de posts, lidos de src/content/blog/{lang}/*.mdx via
// @/lib/blog (ver ali o porquê de não usar CMS/banco de dados). Reaproveita
// o mesmo PostCard usado na seção "Últimos posts" da home.

import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { getDictionary } from "@/i18n/config";
import { getAllPosts } from "@/lib/blog";
import type { Lang } from "@/types";

interface BlogPageProps {
  params: Promise<{ lang: Lang }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const posts = await getAllPosts(lang);

  return (
    <main className="text-fg min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Link
          href={`/${lang}`}
          className="font-mono text-sm text-accent-2 hover:text-accent-2-hover transition-colors"
        >
          {dict.common.backHome}
        </Link>

        <h1 className="mt-6 font-mono text-4xl md:text-5xl font-medium tracking-tight text-fg">
          {dict.blogPage.title}
        </h1>
        <p className="mt-4 text-lg text-fg-muted max-w-2xl">
          {dict.blogPage.subtitle}
        </p>

        <div className="mt-12 flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} lang={lang} />
          ))}
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.blogPage.title,
    description: dict.blogPage.subtitle,
  };
}
