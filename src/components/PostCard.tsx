// src/components/PostCard.tsx

import Link from "next/link";
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
      className="group block rounded-lg border border-border bg-surface p-5 hover:border-accent-2/40 hover:bg-surface-hover transition-colors"
    >
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
    </Link>
  );
}
