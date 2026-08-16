// src/components/window/Taskbar.tsx
//
// Barra fixa no rodapé, sempre visível, com um botão por programa
// registrado via useWindow() — genérica desde o início, não conhece
// "terminal" nem nenhum programa específico.

"use client";

import { useWindowManager } from "./WindowManagerContext";

export function Taskbar() {
  const { windows } = useWindowManager();

  return (
    <div
      data-taskbar
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-border bg-bg/80 backdrop-blur px-4 py-2"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        {windows.map((win) => {
          const Icon = win.icon;
          const isVisible = win.mode === "open" || win.mode === "maximized";
          return (
            <button
              key={win.id}
              type="button"
              onClick={win.toggle}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                isVisible
                  ? "border-accent/40 bg-surface-hover text-fg"
                  : "border-border bg-surface text-fg hover:border-accent/40 hover:bg-surface-hover"
              }`}
            >
              <Icon size={14} strokeWidth={1.75} />
              {win.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
