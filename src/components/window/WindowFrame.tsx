// src/components/window/WindowFrame.tsx
//
// Moldura genérica de janela: titlebar (arrastável, com os 3 botões
// coloridos) + slot de conteúdo + alças de redimensionar. Qualquer
// programa usa isso, passando seu próprio conteúdo como children — não
// sabe nada sobre o que está dentro.

"use client";

import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import type { Rect, ResizeDir, WindowMode } from "./types";

const CONTROL_BUTTON_BASE =
  "flex h-5 w-5 items-center justify-center rounded-full transition-colors";

const RESIZE_HANDLES: { dir: ResizeDir; className: string }[] = [
  { dir: "n", className: "absolute -top-1 left-2 right-2 h-2 cursor-ns-resize touch-none" },
  { dir: "s", className: "absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize touch-none" },
  { dir: "w", className: "absolute -left-1 top-2 bottom-2 w-2 cursor-ew-resize touch-none" },
  { dir: "e", className: "absolute -right-1 top-2 bottom-2 w-2 cursor-ew-resize touch-none" },
  { dir: "nw", className: "absolute -top-1 -left-1 h-3 w-3 cursor-nwse-resize touch-none" },
  { dir: "ne", className: "absolute -top-1 -right-1 h-3 w-3 cursor-nesw-resize touch-none" },
  { dir: "sw", className: "absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize touch-none" },
  { dir: "se", className: "absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize touch-none" },
];

interface WindowFrameProps {
  title: string;
  mode: WindowMode;
  rect: Rect | null;
  isOpen: boolean;
  zIndex: number;
  onTitleBarPointerDown: (e: React.PointerEvent) => void;
  onResizePointerDown: (e: React.PointerEvent, dir: ResizeDir) => void;
  onFocus: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function WindowFrame({
  title,
  mode,
  rect,
  isOpen,
  zIndex,
  onTitleBarPointerDown,
  onResizePointerDown,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onClose,
  children,
}: WindowFrameProps) {
  if (!isOpen) return null;

  const windowStyle: React.CSSProperties =
    mode === "maximized"
      ? { position: "fixed", inset: "5vh 5vw", zIndex }
      : {
          position: "fixed",
          left: rect!.x,
          top: rect!.y,
          width: rect!.width,
          height: rect!.height,
          zIndex,
        };

  return (
    <div
      style={windowStyle}
      // Captura (não bubble) pra trazer a janela pra frente mesmo quando um
      // filho (botão, input) chama stopPropagation no bubble do pointerdown.
      onPointerDownCapture={onFocus}
      className="fixed flex flex-col rounded-lg border border-border bg-bg-elevated font-mono text-xs md:text-[0.8125rem] shadow-2xl overflow-hidden"
    >
      <div
        onPointerDown={onTitleBarPointerDown}
        className="flex items-center gap-2 border-b border-border px-3 py-2 select-none touch-none cursor-move"
      >
        <span className="text-[0.6875rem] text-fg-muted">{title}</span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            aria-label={`Minimizar ${title}`}
            title="Minimizar"
            className={`${CONTROL_BUTTON_BASE} bg-warn text-warn-fg hover:bg-warn-hover`}
          >
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggleMaximize}
            aria-label={mode === "maximized" ? `Restaurar ${title}` : `Maximizar ${title}`}
            title={mode === "maximized" ? "Restaurar" : "Maximizar"}
            className={`${CONTROL_BUTTON_BASE} bg-accent text-accent-fg hover:bg-accent-hover`}
          >
            {mode === "maximized" ? (
              <Minimize2 size={11} strokeWidth={2.5} />
            ) : (
              <Maximize2 size={11} strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label={`Fechar ${title}`}
            title="Fechar"
            className={`${CONTROL_BUTTON_BASE} bg-danger text-danger-fg hover:bg-danger-hover`}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {children}

      {mode === "open" &&
        RESIZE_HANDLES.map(({ dir, className }) => (
          <div
            key={dir}
            onPointerDown={(e) => onResizePointerDown(e, dir)}
            className={className}
            aria-hidden="true"
          />
        ))}
    </div>
  );
}
