// src/data/projects.ts
//
// Dados mockados — substituir por @/data/projects.json (ou um CMS) quando
// existir uma fonte real. Estruturado por idioma (Record<Lang, Project[]>)
// pra já bater com ProjectsData em @/types.

import type { Lang, Project, ProjectsData } from "@/types";

export const projectsByLang: ProjectsData = {
  pt: [
    {
      title: "Reconhecimento de lances de xadrez com IA",
      date: "2025-03-01",
      featured: true,
      description:
        "TCC da Engenharia de Telecomunicações: reconhecimento de lances de xadrez a partir de imagens, usando Python, OpenCV e YOLOv11.",
      tags: ["Python", "OpenCV", "YOLOv11"],
      links: [
        {
          label: "Veja mais",
          href: "https://wiki.sj.ifsc.edu.br/index.php/Reconhecimento_por_Imagem_de_Lances_de_Xadrez_com_Vis%C3%A3o_Computacional_e_Redes_Neurais_Convolucionais",
          variant: "primary",
          icon: "external",
        },
        {
          label: "Repositório",
          href: "https://github.com/andreyadriano/chess-recognition",
          variant: "secondary",
          icon: "github",
        },
      ],
    },
    {
      title: "Site comercial para Disk Gás",
      date: "2023-06-01",
      featured: true,
      description:
        "Site institucional para um comércio de bairro, direcionando clientes para o WhatsApp. Também cuido da manutenção.",
      tags: ["HTML", "CSS", "JavaScript"],
      links: [
        {
          label: "Visitar",
          href: "https://diskgasadriano.netlify.app",
          variant: "primary",
          icon: "external",
        },
      ],
    },
    {
      title: "Yin Yang",
      date: "2019-08-01",
      featured: true,
      description:
        "Meu primeiro contato com programação: um jogo de ação e aventura criado em 2019 para a Feira de Jogos do curso técnico.",
      tags: ["JavaScript", "Game Dev"],
      links: [
        {
          label: "Jogar (PC)",
          href: "https://piyinyang.github.io/yinyang/",
          variant: "primary",
          icon: "external",
        },
        {
          label: "Repositório",
          href: "https://github.com/piyinyang/yinyang",
          variant: "secondary",
          icon: "github",
        },
      ],
    },
  ],
  en: [
    {
      title: "Chess move recognition with AI",
      date: "2025-03-01",
      featured: true,
      description:
        "Telecommunications Engineering thesis: recognizing chess moves from images using Python, OpenCV, and a YOLOv11 model.",
      tags: ["Python", "OpenCV", "YOLOv11"],
      links: [
        {
          label: "Read more",
          href: "https://wiki.sj.ifsc.edu.br/index.php/Reconhecimento_por_Imagem_de_Lances_de_Xadrez_com_Vis%C3%A3o_Computacional_e_Redes_Neurais_Convolucionais",
          variant: "primary",
          icon: "external",
        },
        {
          label: "Repository",
          href: "https://github.com/andreyadriano/chess-recognition",
          variant: "secondary",
          icon: "github",
        },
      ],
    },
    {
      title: "Commercial site for Disk Gás",
      date: "2023-06-01",
      featured: true,
      description:
        "Business site for a local shop, directing customers to WhatsApp. I still maintain it.",
      tags: ["HTML", "CSS", "JavaScript"],
      links: [
        {
          label: "Visit",
          href: "https://diskgasadriano.netlify.app",
          variant: "primary",
          icon: "external",
        },
      ],
    },
    {
      title: "Yin Yang",
      date: "2019-08-01",
      featured: true,
      description:
        "My first contact with programming: an action-adventure game built in 2019 for my technical course's Game Fair.",
      tags: ["JavaScript", "Game Dev"],
      links: [
        {
          label: "Play (PC)",
          href: "https://piyinyang.github.io/yinyang/",
          variant: "primary",
          icon: "external",
        },
        {
          label: "Repository",
          href: "https://github.com/piyinyang/yinyang",
          variant: "secondary",
          icon: "github",
        },
      ],
    },
  ],
};

export function getFeaturedProjects(lang: Lang, limit = 3): Project[] {
  return projectsByLang[lang]
    .filter((project) => project.featured)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}
