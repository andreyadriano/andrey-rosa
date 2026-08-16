// src/components/window/useWindow.ts
//
// Hook genérico de mecânica de janela — mode/posição/tamanho, arrastar,
// redimensionar por qualquer borda/canto, minimizar/maximizar/fechar.
// Qualquer "programa" (Terminal, futuramente o Explorador de Arquivos)
// chama isso pra ganhar uma janela, e registra sua entrada na Taskbar
// automaticamente. Não sabe nada sobre o conteúdo do programa.

"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowManager } from "./WindowManagerContext";
import type { Rect, ResizeDir, WindowMode, WindowOptions } from "./types";

const DEFAULT_MIN_SIZE = { width: 280, height: 200 };

interface PersistedWindowState {
  mode: WindowMode;
  rect: Rect | null;
  preMaximizeRect: Rect | null;
}

// Troca de idioma (/pt <-> /en) remonta [lang]/layout.tsx e, com ele, todo
// programa montado nele — mesmo sendo o mesmo programa conceitualmente.
// Guardar aqui, fora do React e por id, é o que faz cada janela sobreviver
// a esse remount sem resetar posição/modo.
const persistedWindows = new Map<string, PersistedWindowState>();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCenteredRect(size: { width: number; height: number }): Rect {
  const width = Math.min(size.width, window.innerWidth - 32);
  const height = Math.min(size.height, window.innerHeight - 32);
  return {
    x: Math.max(16, (window.innerWidth - width) / 2),
    y: Math.max(16, (window.innerHeight - height) / 2),
    width,
    height,
  };
}

export interface UseWindowResult {
  mode: WindowMode;
  rect: Rect | null;
  isOpen: boolean;
  onTitleBarPointerDown: (e: React.PointerEvent) => void;
  onResizePointerDown: (e: React.PointerEvent, dir: ResizeDir) => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
}

export function useWindow(options: WindowOptions): UseWindowResult {
  const { id, title, icon, defaultSize, minSize = DEFAULT_MIN_SIZE } = options;
  const { upsert, remove } = useWindowManager();

  const persisted = persistedWindows.get(id);
  const isFreshMount = useRef(persisted === undefined);

  const [mode, setMode] = useState<WindowMode>(persisted?.mode ?? "open");
  const [rect, setRect] = useState<Rect | null>(persisted?.rect ?? null);
  const [preMaximizeRect, setPreMaximizeRect] = useState<Rect | null>(
    persisted?.preMaximizeRect ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originW: number;
    originH: number;
    dir: ResizeDir;
  } | null>(null);

  // Mantém o módulo em sincronia com o estado atual a cada render, pra
  // sobreviver a um remount (ver comentário de PersistedWindowState acima).
  useEffect(() => {
    persistedWindows.set(id, { mode, rect, preMaximizeRect });
  });

  // Evita selecionar texto da página sem querer enquanto arrasta/redimensiona.
  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [isDragging, isResizing]);

  // Abre centralizada assim que monta de verdade — numa troca de idioma
  // (remount, não primeira montagem), mantém a posição restaurada.
  useEffect(() => {
    if (!isFreshMount.current) return;
    const t = setTimeout(() => setRect(getCenteredRect(defaultSize)), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arrastar (titlebar).
  useEffect(() => {
    if (!isDragging) return;
    function handleMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setRect(
        (r) =>
          r && {
            ...r,
            x: clamp(drag.originX + dx, -r.width + 160, window.innerWidth - 80),
            y: clamp(drag.originY + dy, 0, window.innerHeight - 40),
          },
      );
    }
    function handleUp() {
      setIsDragging(false);
      dragRef.current = null;
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  // Redimensionar por qualquer borda/canto, só flutuante.
  useEffect(() => {
    if (!isResizing) return;
    function handleMove(e: PointerEvent) {
      const resize = resizeRef.current;
      if (!resize) return;
      const dx = e.clientX - resize.startX;
      const dy = e.clientY - resize.startY;
      const { dir, originX, originY, originW, originH } = resize;

      let x = originX;
      let y = originY;
      let width = originW;
      let height = originH;

      if (dir.includes("e")) {
        width = clamp(
          originW + dx,
          minSize.width,
          window.innerWidth - originX - 16,
        );
      }
      if (dir.includes("s")) {
        height = clamp(
          originH + dy,
          minSize.height,
          window.innerHeight - originY - 16,
        );
      }
      if (dir.includes("w")) {
        const rightEdge = originX + originW;
        x = clamp(originX + dx, 16, rightEdge - minSize.width);
        width = rightEdge - x;
      }
      if (dir.includes("n")) {
        const bottomEdge = originY + originH;
        y = clamp(originY + dy, 16, bottomEdge - minSize.height);
        height = bottomEdge - y;
      }

      setRect({ x, y, width, height });
    }
    function handleUp() {
      setIsResizing(false);
      resizeRef.current = null;
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isResizing, minSize.width, minSize.height]);

  function onTitleBarPointerDown(e: React.PointerEvent) {
    let originRect = rect ?? getCenteredRect(defaultSize);

    if (mode === "maximized") {
      originRect = preMaximizeRect ?? getCenteredRect(defaultSize);
      setRect(originRect);
      setPreMaximizeRect(null);
      setMode("open");
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: originRect.x,
      originY: originRect.y,
    };
    setIsDragging(true);
  }

  function onResizePointerDown(e: React.PointerEvent, dir: ResizeDir) {
    e.stopPropagation();
    if (!rect) return;
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.x,
      originY: rect.y,
      originW: rect.width,
      originH: rect.height,
      dir,
    };
    setIsResizing(true);
  }

  function minimize() {
    setMode("minimized");
  }

  function toggleMaximize() {
    if (mode === "maximized") {
      if (preMaximizeRect) setRect(preMaximizeRect);
      setPreMaximizeRect(null);
      setMode("open");
      return;
    }
    setPreMaximizeRect(rect ?? getCenteredRect(defaultSize));
    setMode("maximized");
  }

  function close() {
    setMode("closed");
    setRect(null);
    setPreMaximizeRect(null);
  }

  function restore() {
    if (!rect) setRect(getCenteredRect(defaultSize));
    setMode("open");
  }

  function toggle() {
    if (mode === "open" || mode === "maximized") {
      minimize();
    } else {
      restore();
    }
  }

  // Registra/atualiza a entrada na Taskbar sempre que mode/rect mudam.
  useEffect(() => {
    upsert({ id, title, icon, mode, toggle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title, icon, mode, rect]);

  // Remove da Taskbar só no unmount de verdade (não deveria acontecer pra
  // programas montados no layout, mas fica correto se acontecer).
  useEffect(() => {
    return () => remove(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOpen = rect !== null && (mode === "open" || mode === "maximized");

  return {
    mode,
    rect,
    isOpen,
    onTitleBarPointerDown,
    onResizePointerDown,
    minimize,
    toggleMaximize,
    close,
  };
}
