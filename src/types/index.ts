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
  summary: string;
  skills: string[];
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
}

export type ProjectsData = Record<Lang, Project[]>;

export interface Post {
  title: string;
  summary: string;
  date: string;
  slug: string;
  readingTime: number;
}
