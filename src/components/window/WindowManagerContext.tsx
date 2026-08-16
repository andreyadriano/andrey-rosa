// src/components/window/WindowManagerContext.tsx
//
// Registro central de "programas" abertos, só pra <Taskbar> conseguir
// mostrar um botão por programa sem precisar conhecer cada um deles.
// useWindow() é quem registra/atualiza sua própria entrada aqui.

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { IconComponent, WindowMode } from "./types";

export interface WindowRegistryEntry {
  id: string;
  title: string;
  icon: IconComponent;
  mode: WindowMode;
  toggle: () => void;
  minimize: () => void;
}

interface WindowManagerContextValue {
  windows: WindowRegistryEntry[];
  upsert: (entry: WindowRegistryEntry) => void;
  remove: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null,
);

export function WindowManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [registry, setRegistry] = useState<
    Record<string, WindowRegistryEntry>
  >({});

  const upsert = useCallback((entry: WindowRegistryEntry) => {
    setRegistry((prev) => ({ ...prev, [entry.id]: entry }));
  }, []);

  const remove = useCallback((id: string) => {
    setRegistry((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Clicar fora de qualquer janela (e fora da taskbar) minimiza todas as
  // janelas abertas, pra quem só quer ver a página sem precisar fechar
  // cada uma manualmente. `data-window-root`/`data-taskbar` marcam o que
  // conta como "dentro" — ver WindowFrame.tsx e Taskbar.tsx.
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-window-root], [data-taskbar]")) return;

      for (const entry of Object.values(registry)) {
        if (entry.mode === "open" || entry.mode === "maximized") {
          entry.minimize();
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [registry]);

  return (
    <WindowManagerContext.Provider
      value={{ windows: Object.values(registry), upsert, remove }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager(): WindowManagerContextValue {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) {
    throw new Error(
      "useWindowManager precisa estar dentro de um <WindowManagerProvider>",
    );
  }
  return ctx;
}
