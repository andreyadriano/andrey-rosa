// src/components/window/types.ts
//
// Contrato compartilhado por qualquer "programa" (Terminal, e futuramente
// o Explorador de Arquivos) que precise de uma janela arrastável/
// redimensionável/minimizável — a "interface" que cada app implementa
// chamando useWindow() e renderizando <WindowFrame>.

export type WindowMode = "open" | "maximized" | "minimized" | "closed";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// Só o formato que os ícones do lucide-react têm — evita depender do nome
// exato do tipo exportado pela lib.
export type IconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

export interface WindowOptions {
  id: string; // identidade única do programa: "terminal", "file-explorer"
  title: string; // mostrado na titlebar e na taskbar
  icon: IconComponent;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  // Modo na primeira montagem de verdade (não numa troca de idioma, que
  // restaura o modo persistido). Default "open" — usado pelo Terminal, que
  // quer aparecer com a animação de boot já na primeira visita.
  defaultMode?: WindowMode;
}
