// src/components/apps/Terminal/index.tsx
//
// Terminal como "programa": usa useWindow() pra mecânica de janela e
// useShell() pra emulação de shell, e só compõe os dois dentro de
// <WindowFrame>. Montado uma vez em src/app/[lang]/layout.tsx.

"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { useWindow } from "@/components/window/useWindow";
import { WindowFrame } from "@/components/window/WindowFrame";
import type { Rect } from "@/components/window/types";
import type { VfsDirectory } from "@/lib/vfs/types";
import { useShell } from "./useShell";
import type { ErrorMessages, HelpEntry, Row } from "./types";

const APP_ID = "terminal";
// Tamanho usado tanto pro redimensionamento padrão (maximizar/restaurar)
// quanto pro rect inicial abaixo — de propósito menor que antes, pra abrir
// como um widget discreto no canto, não uma janela dominante.
const DEFAULT_SIZE = { width: 420, height: 320 };

// max-w-6xl (1152px) + px-6 de padding dos dois lados (24px cada) — a
// largura total da coluna de conteúdo centralizada da hero (ver
// src/app/[lang]/page.tsx). Usado pra calcular a borda direita real do
// conteúdo em vez de supor uma largura de tela fixa: acima de
// CONTENT_MAX_WIDTH o conteúdo fica centralizado com margem sobrando nas
// laterais, e é só nessa margem que o terminal pode abrir sem sobrepor.
const CONTENT_MAX_WIDTH = 1200;
const MARGIN = 24;
const MIN_TERMINAL_WIDTH = 320;
// Só abre sozinho se sobrar espaço suficiente na margem lateral pra um
// terminal minimamente usável; abaixo disso (a maioria das telas,
// incluindo mobile) começa minimizado na Taskbar, sem cobrir nada.
const MIN_OPEN_WIDTH = CONTENT_MAX_WIDTH + (MIN_TERMINAL_WIDTH + MARGIN) * 2;
const TASKBAR_CLEARANCE = 64; // espaço reservado pra Taskbar fixa no rodapé

function getBottomRightRect(size: { width: number; height: number }): Rect {
  const contentRightEdge =
    window.innerWidth > CONTENT_MAX_WIDTH
      ? (window.innerWidth + CONTENT_MAX_WIDTH) / 2
      : window.innerWidth;
  const maxWidth = window.innerWidth - contentRightEdge - MARGIN;
  const width = Math.min(size.width, maxWidth);
  const height = Math.min(size.height, window.innerHeight - TASKBAR_CLEARANCE - MARGIN);
  return {
    x: window.innerWidth - width - MARGIN,
    y: window.innerHeight - height - TASKBAR_CLEARANCE,
    width,
    height,
  };
}

interface TerminalAppProps {
  prompt: string;
  bootCommand: string;
  bootLines: string[];
  rows: Row[];
  fs: VfsDirectory;
  help: HelpEntry[];
  errors: ErrorMessages;
}

export function TerminalApp({
  prompt,
  bootCommand,
  bootLines,
  rows,
  fs,
  help,
  errors,
}: TerminalAppProps) {
  const win = useWindow({
    id: APP_ID,
    title: "terminal",
    icon: TerminalIcon,
    defaultSize: DEFAULT_SIZE,
    getDefaultRect: getBottomRightRect,
    minOpenWidth: MIN_OPEN_WIDTH,
  });
  const {
    phase,
    bootShown,
    typedLen,
    bootLines: shellBootLines,
    bootCommand: shellBootCommand,
    log,
    input,
    setInput,
    handleKeyDown,
    promptDisplay,
    inputRef,
    scrollRef,
    reset,
  } = useShell({ id: APP_ID, prompt, bootCommand, bootLines, rows, fs, help, errors });

  function handleClose() {
    win.close();
    reset();
  }

  function focusInput() {
    if (phase === "ready") inputRef.current?.focus();
  }

  return (
    <WindowFrame
      title="terminal"
      mode={win.mode}
      rect={win.rect}
      isOpen={win.isOpen}
      zIndex={win.zIndex}
      onTitleBarPointerDown={win.onTitleBarPointerDown}
      onResizePointerDown={win.onResizePointerDown}
      onFocus={win.bringToFront}
      onMinimize={win.minimize}
      onToggleMaximize={win.toggleMaximize}
      onClose={handleClose}
    >
      <div
        ref={scrollRef}
        onClick={focusInput}
        className="flex-1 min-h-0 px-4 py-3 overflow-y-auto"
      >
        {phase === "boot" &&
          shellBootLines.slice(0, bootShown).map((line) => (
            <p key={line} className="text-fg-muted">
              {line}
            </p>
          ))}

        {phase === "typing" && (
          <p className="text-accent-2">
            {promptDisplay}{" "}
            <span className="text-fg">
              {shellBootCommand.slice(0, typedLen)}
              <span className="animate-pulse">▌</span>
            </span>
          </p>
        )}

        {phase === "ready" && (
          <>
            {log.map((entry) =>
              entry.type === "cmd" ? (
                <p key={entry.id} className="text-accent-2">
                  {promptDisplay} <span className="text-fg">{entry.content}</span>
                </p>
              ) : (
                <div key={entry.id}>{entry.content}</div>
              ),
            )}

            <div className="flex items-center gap-2 text-accent-2">
              <span>{promptDisplay}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label={promptDisplay}
                placeholder="help"
                className="flex-1 min-w-0 bg-transparent text-fg outline-none placeholder:text-fg-muted/60"
              />
            </div>
          </>
        )}
      </div>
    </WindowFrame>
  );
}
