// src/components/ProjectCard/index.tsx

import { ExternalLink } from "lucide-react";
import { GithubIcon, GITHUB_LINK_CLASSNAME } from "@/components/icons";
import { ProjectCover } from "./Cover";
import { StackIcon } from "./StackIcon";
import type { Lang, Project } from "@/types";

export function ProjectCard({ project, lang }: { project: Project; lang: Lang }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-5 hover:border-accent/40 hover:bg-surface-hover transition-colors">
      <ProjectCover
        image={project.image}
        title={project.title}
        tags={project.tags}
        coverVariant={project.coverVariant}
        lang={lang}
      />
      <h3 className="mt-4 font-mono text-base text-fg line-clamp-2 min-h-[3rem]">
        {project.title}
      </h3>
      <p className="mt-2 text-sm text-fg-muted leading-relaxed line-clamp-3 min-h-[4.25rem]">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium px-2 py-0.5 rounded border border-border text-accent-2"
          >
            <StackIcon tag={tag} />
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 border-t border-border">
        {project.links.map((link) => {
          const isGithub = link.icon === "github";
          const LinkIcon = isGithub ? GithubIcon : ExternalLink;
          const className = isGithub
            ? GITHUB_LINK_CLASSNAME
            : link.variant === "primary"
              ? "bg-accent text-accent-fg hover:bg-accent-hover border-accent"
              : "border-border hover:border-border-strong";
          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${className}`}
            >
              <LinkIcon size={13} strokeWidth={1.75} />
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
