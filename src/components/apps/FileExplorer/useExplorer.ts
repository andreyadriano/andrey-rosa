// src/components/apps/FileExplorer/useExplorer.ts
//
// Navegação sobre o VFS simulado: cwd + abrir um nó (pasta desce, imagem
// mostra preview, link/texto abre). Persistência entre remounts de troca
// de idioma segue o mesmo padrão de useShell.ts — Map por id, fora do
// React, porque esse estado não pertence à janela (useWindow.ts) nem é
// recriado a cada render.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNode } from "@/lib/vfs/path";
import type { VfsDirectory, VfsNode } from "@/lib/vfs/types";
import type { Preview } from "./types";

interface ExplorerPersistedState {
  cwd: string[];
}

const persistedExplorers = new Map<string, ExplorerPersistedState>();

interface UseExplorerOptions {
  id: string;
  fs: VfsDirectory;
}

export function useExplorer({ id, fs }: UseExplorerOptions) {
  const router = useRouter();
  const persisted = persistedExplorers.get(id);

  const [cwd, setCwd] = useState<string[]>(() => persisted?.cwd ?? []);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    persistedExplorers.set(id, { cwd });
  });

  const node = getNode(fs, cwd);
  const currentDir: VfsDirectory =
    node && node.type === "directory" ? node : fs;

  function open(target: VfsNode) {
    if (target.type === "directory") {
      setCwd([...cwd, target.name]);
      setPreview(null);
      return;
    }

    if (target.kind === "text") {
      setPreview({ kind: "text", name: target.name, content: target.content });
      return;
    }

    if (target.kind === "image" && target.src) {
      setPreview({ kind: "image", name: target.name, src: target.src });
      return;
    }

    if (target.kind === "link" && target.href) {
      if (target.href.startsWith("/")) {
        router.push(target.href);
      } else {
        window.open(target.href, "_blank", "noreferrer");
      }
    }
  }

  function goUp() {
    setCwd((prev) => prev.slice(0, -1));
    setPreview(null);
  }

  function goHome() {
    setCwd([]);
    setPreview(null);
  }

  function closePreview() {
    setPreview(null);
  }

  // Fechar a janela volta pra raiz — mesma semântica do Terminal (minimizar
  // preserva, fechar reseta o conteúdo, não a janela em si).
  function reset() {
    setCwd([]);
    setPreview(null);
  }

  return { cwd, currentDir, preview, open, goUp, goHome, closePreview, reset };
}
