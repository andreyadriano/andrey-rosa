// src/components/apps/FileExplorer/index.tsx
//
// Explorador de arquivos como "programa": segundo app construído sobre o
// sistema de janelas genérico (useWindow/WindowFrame), navegando a mesma
// árvore do VFS que o Terminal (src/lib/vfs) — zero mudança em nenhum dos
// dois pra isso existir.

"use client";

import { FolderOpen, ArrowUp, X } from "lucide-react";
import { useWindow } from "@/components/window/useWindow";
import { WindowFrame } from "@/components/window/WindowFrame";
import { formatCwd } from "@/lib/vfs/path";
import type { VfsDirectory } from "@/lib/vfs/types";
import { useExplorer } from "./useExplorer";
import { FileIcon } from "./FileIcon";

const APP_ID = "file-explorer";
// Curto de propósito e não traduzido — mesmo padrão do Terminal ("terminal"
// fixo nos dois idiomas): título aparece na taskbar ao lado do Terminal, e
// nomes muito diferentes em tamanho deixam os botões desbalanceados.
const APP_TITLE = "arquivos";
const DEFAULT_SIZE = { width: 480, height: 380 };

interface FileExplorerAppProps {
  fs: VfsDirectory;
  rootLabel: string;
  upLabel: string;
  emptyLabel: string;
  closePreviewLabel: string;
}

export function FileExplorerApp({
  fs,
  rootLabel,
  upLabel,
  emptyLabel,
  closePreviewLabel,
}: FileExplorerAppProps) {
  const win = useWindow({
    id: APP_ID,
    title: APP_TITLE,
    icon: FolderOpen,
    defaultSize: DEFAULT_SIZE,
    defaultMode: "minimized",
  });
  const { cwd, currentDir, preview, open, goUp, goHome, closePreview, reset } =
    useExplorer({ id: APP_ID, fs });

  function handleClose() {
    win.close();
    reset();
  }

  const breadcrumb = cwd.length === 0 ? rootLabel : formatCwd(cwd);

  return (
    <WindowFrame
      title={APP_TITLE}
      mode={win.mode}
      rect={win.rect}
      isOpen={win.isOpen}
      onTitleBarPointerDown={win.onTitleBarPointerDown}
      onResizePointerDown={win.onResizePointerDown}
      onMinimize={win.minimize}
      onToggleMaximize={win.toggleMaximize}
      onClose={handleClose}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 font-mono text-xs">
        <button
          type="button"
          onClick={goUp}
          disabled={cwd.length === 0}
          aria-label={upLabel}
          title={upLabel}
          className="flex h-6 w-6 items-center justify-center rounded text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-muted"
        >
          <ArrowUp size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={goHome}
          className="truncate text-fg-muted hover:text-fg"
        >
          {breadcrumb}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {preview ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs text-fg-muted">
                {preview.name}
              </span>
              <button
                type="button"
                onClick={closePreview}
                aria-label={closePreviewLabel}
                title={closePreviewLabel}
                className="flex h-6 w-6 items-center justify-center rounded text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
            {preview.kind === "text" ? (
              <p className="whitespace-pre-wrap font-mono text-xs text-fg-subtle">
                {preview.content}
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.src}
                alt={preview.name}
                className="max-w-full rounded border border-border"
              />
            )}
          </div>
        ) : currentDir.children.length === 0 ? (
          <p className="font-mono text-xs text-fg-muted">{emptyLabel}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {currentDir.children.map((child) => (
              <button
                key={child.name}
                type="button"
                onClick={() => open(child)}
                className="flex flex-col items-center gap-1.5 rounded-md p-2 text-center transition-colors hover:bg-surface-hover"
              >
                <FileIcon node={child} />
                <span className="w-full truncate font-mono text-[0.6875rem] text-fg-muted">
                  {child.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </WindowFrame>
  );
}
