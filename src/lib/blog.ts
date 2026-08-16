// src/lib/blog.ts
//
// Lê os posts do blog direto de src/content/blog/{lang}/{slug}.mdx — sem
// CMS, sem banco de dados. Cada post exporta `metadata` (título, resumo,
// data) como um objeto JS no topo do arquivo — o padrão que a própria
// documentação do Next.js recomenda pro App Router (ver next.config.ts
// pra entender por que não usamos frontmatter em YAML aqui).

import fs from "node:fs";
import path from "node:path";
import type { Lang, Post } from "@/types";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const WORDS_PER_MINUTE = 200;

interface PostMetadata {
  title: string;
  summary: string;
  date: string;
}

function postsDir(lang: Lang): string {
  return path.join(BLOG_DIR, lang);
}

export function getPostSlugs(lang: Lang): string[] {
  const dir = postsDir(lang);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getReadingTime(lang: Lang, slug: string): number {
  const filePath = path.join(postsDir(lang), `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf8");
  const words = raw.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

async function getPostMeta(lang: Lang, slug: string): Promise<Post | null> {
  try {
    const mod = await import(`@/content/blog/${lang}/${slug}.mdx`);
    const metadata = mod.metadata as PostMetadata;

    return {
      slug,
      title: metadata.title,
      summary: metadata.summary,
      date: metadata.date,
      readingTime: getReadingTime(lang, slug),
    };
  } catch {
    return null;
  }
}

export async function getAllPosts(lang: Lang): Promise<Post[]> {
  const posts = await Promise.all(
    getPostSlugs(lang).map((slug) => getPostMeta(lang, slug)),
  );

  return posts
    .filter((post): post is Post => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
