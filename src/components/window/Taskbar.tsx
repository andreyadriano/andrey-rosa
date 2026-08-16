// src/components/window/Taskbar.tsx
//
// Barra fixa no rodapé, sempre visível, com um botão por programa
// registrado via useWindow() — genérica desde o início, não conhece
// "terminal" nem nenhum programa específico. Cada botão sinaliza o estado
// do programa (aberto/minimizado/fechado) por cor da bolinha + opacidade,
// não só por "aberto vs. resto" como antes.

"use client";

import { useWindowManager } from "./WindowManagerContext";

interface TaskbarProps {
  minimizedLabel: string;
  closedLabel: string;
}

export function Taskbar({ minimizedLabel, closedLabel }: TaskbarProps) {
  const { windows } = useWindowManager();

  return (
    <div
      data-taskbar
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-border bg-bg/80 backdrop-blur px-4 py-2"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        {windows.map((win) => {
          const Icon = win.icon;
          const isActive = win.mode === "open" || win.mode === "maximized";
          const isClosed = win.mode === "closed";
          const stateLabel = isClosed
            ? closedLabel
            : !isActive
              ? minimizedLabel
              : null;
          const label = stateLabel ? `${win.title} — ${stateLabel}` : win.title;

          return (
            <button
              key={win.id}
              type="button"
              onClick={win.toggle}
              title={label}
              aria-label={label}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                isActive
                  ? "border-accent/40 bg-surface-hover text-fg"
                  : isClosed
                    ? "border-border/60 bg-transparent text-fg-muted hover:border-accent/40 hover:bg-surface-hover hover:text-fg"
                    : "border-border bg-surface text-fg-muted hover:border-accent/40 hover:bg-surface-hover hover:text-fg"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-accent animate-pulse" : isClosed ? "bg-border" : "bg-warn"
                }`}
              />
              <Icon size={14} strokeWidth={1.75} />
              {win.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
