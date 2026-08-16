// src/components/window/WindowManagerContext.tsx
//
// Registro central de "programas" abertos, só pra <Taskbar> conseguir
// mostrar um botão por programa sem precisar conhecer cada um deles.
// useWindow() é quem registra/atualiza sua própria entrada aqui.

"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { IconComponent, WindowMode } from "./types";

export interface WindowRegistryEntry {
  id: string;
  title: string;
  icon: IconComponent;
  mode: WindowMode;
  toggle: () => void;
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
