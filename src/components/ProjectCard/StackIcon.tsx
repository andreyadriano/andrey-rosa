// src/components/ProjectCard/StackIcon.tsx
//
// Ícone de marca por tecnologia nos chips de stack dos cards de projeto.
// Os paths vêm do pacote simple-icons (só dados brutos — path + hex, sem
// wrapper React) em vez de inlinar SVG na mão como em icons.tsx: aqui são
// muitas tecnologias e tendem a crescer, então vale a dependência.
//
// A cor de cada ícone usa o hex oficial da marca (ex.: azul do Python,
// amarelo do JavaScript) — mesma exceção documentada em AGENTS.md pra
// cores de marca de terceiros (ex.: azul do LinkedIn), não o sistema de
// tokens semânticos do site. Tag sem ícone de marca conhecido (ex.: "Game
// Dev") cai num ícone genérico neutro.

import { Code2 } from "lucide-react";
import { siCss, siGo, siHtml5, siJavascript, siOpencv, siPython, siReact, siYolo } from "simple-icons";

const STACK_ICONS: Record<string, { path: string; hex: string }> = {
  Python: siPython,
  HTML: siHtml5,
  CSS: siCss,
  JavaScript: siJavascript,
  OpenCV: siOpencv,
  YOLOv11: siYolo,
  Go: siGo,
  React: siReact,
};

export function StackIcon({ tag, size = 12 }: { tag: string; size?: number }) {
  const icon = STACK_ICONS[tag];

  if (!icon) {
    return (
      <Code2
        size={size}
        strokeWidth={1.75}
        className="text-fg-muted"
        aria-hidden="true"
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={`#${icon.hex}`} aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}
