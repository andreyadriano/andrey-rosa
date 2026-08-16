// src/components/socials.tsx
//
// Lista de redes/contato compartilhada entre o hero (src/app/[lang]/page.tsx)
// e o rodapé (Footer.tsx) — evita duplicar hrefs e estilos em dois lugares.

import { Mail } from "lucide-react";
import {
  GithubIcon,
  LinkedinIcon,
  GITHUB_LINK_CLASSNAME,
} from "@/components/icons";

export const socials = [
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
