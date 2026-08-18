// src/types/index.ts

export type Lang = "pt" | "en";

export interface ExperienceItem {
  company: string;
  position: string;
  period: string;
  highlights: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  period: string;
}

export interface Resume {
  name: string;
  role: string;
  email: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: Record<string, string[]>;
  languages: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
}

export type ResumeData = Record<Lang, Resume>;

export interface ProjectLink {
  label: string;
  href: string;
  variant: "primary" | "secondary";
  icon: "external" | "github";
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
  date: string;
  featured: boolean;
  // Screenshot real do projeto (public/images/projects/*). Quando ausente,
  // ProjectCard gera uma capa a partir dos ícones das tags — não é
  // obrigatório ter uma imagem pronta pra todo projeto novo.
  image?: string;
  // Só usado quando `image` está ausente: troca a capa gerada (ícones das
  // tags) por uma ilustração específica — ver COVER_VARIANTS em Cover.tsx.
  // Qualquer texto que a ilustração precise (ex.: rótulo de confiança do
  // "chess-ai") é dela mesma decidir a partir de `lang`, não do Project —
  // é detalhe de como a capa é desenhada, não um dado do projeto.
  coverVariant?: string;
}

export type ProjectsData = Record<Lang, Project[]>;

export interface Post {
  title: string;
  summary: string;
  date: string;
  slug: string;
  readingTime: number;
}
