// src/components/PostCard.tsx

import Link from "next/link";
import { BlogPostIcon } from "@/components/blogIcons";
import type { Lang, Post } from "@/types";

const READING_TIME_LABEL: Record<Lang, (minutes: number) => string> = {
  pt: (minutes) => `${minutes} min de leitura`,
  en: (minutes) => `${minutes} min read`,
};

export function PostCard({ post, lang }: { post: Post; lang: Lang }) {
  const dateLocale = lang === "pt" ? "pt-BR" : "en-US";

  return (
    <Link
      href={`/${lang}/blog/${post.slug}`}
      className="group flex overflow-hidden rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-surface-hover transition-colors"
    >
      <div className="flex w-16 shrink-0 items-center justify-center bg-accent/15 text-accent group-hover:bg-accent/20 transition-colors">
        <BlogPostIcon icon={post.icon} size={26} />
      </div>
      <div className="min-w-0 flex-1 p-5">
        <div className="flex items-center gap-2 font-mono text-[0.6875rem] text-fg-muted">
          <time>
            {new Date(post.date).toLocaleDateString(dateLocale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </time>
          <span aria-hidden="true">·</span>
          <span>{READING_TIME_LABEL[lang](post.readingTime)}</span>
        </div>
        <h3 className="mt-2 font-mono text-base text-fg group-hover:text-accent-2 transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          {post.summary}
        </p>
      </div>
    </Link>
  );
}
