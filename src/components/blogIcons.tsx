// src/components/blogIcons.tsx
//
// Ícone por post do blog — cada .mdx declara `icon` (uma chave abaixo) nos
// metadados; sem correspondência (ou campo ausente), cai no ícone genérico
// FileText. Registro fechado (não string→componente dinâmico) pra manter
// os ícones tree-shakeable e o valor de `icon` validado só pelas chaves
// existentes aqui.

import { Code2, FileText, Smartphone } from "lucide-react";
import type { IconComponent } from "@/components/window/types";

export const BLOG_ICONS = {
  smartphone: Smartphone,
  code: Code2,
} satisfies Record<string, IconComponent>;

export type BlogIconName = keyof typeof BLOG_ICONS;

export function BlogPostIcon({ icon, size = 18 }: { icon?: string; size?: number }) {
  const Icon = (icon && BLOG_ICONS[icon as BlogIconName]) || FileText;
  return <Icon size={size} strokeWidth={1.75} />;
}
