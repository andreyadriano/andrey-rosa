// src/components/apps/Terminal/index.tsx
//
// Terminal como "programa": usa useWindow() pra mecânica de janela e
// useShell() pra emulação de shell, e só compõe os dois dentro de
// <WindowFrame>. Montado uma vez em src/app/[lang]/layout.tsx.

"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { useWindow } from "@/components/window/useWindow";
import { WindowFrame } from "@/components/window/WindowFrame";
import type { VfsDirectory } from "@/lib/vfs/types";
import { useShell } from "./useShell";
import type { HelpEntry, Row } from "./types";

const APP_ID = "terminal";
const DEFAULT_SIZE = { width: 520, height: 420 };

interface TerminalAppProps {
  prompt: string;
  bootCommand: string;
  bootLines: string[];
  rows: Row[];
  fs: VfsDirectory;
  help: HelpEntry[];
}

export function TerminalApp({
  prompt,
  bootCommand,
  bootLines,
  rows,
  fs,
  help,
}: TerminalAppProps) {
  const win = useWindow({
    id: APP_ID,
    title: "terminal",
    icon: TerminalIcon,
    defaultSize: DEFAULT_SIZE,
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
  } = useShell({ id: APP_ID, prompt, bootCommand, bootLines, rows, fs, help });

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
      onTitleBarPointerDown={win.onTitleBarPointerDown}
      onResizePointerDown={win.onResizePointerDown}
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
