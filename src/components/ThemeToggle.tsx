// src/components/ThemeToggle.tsx
//
// Alterna entre tema claro/escuro via atributo data-theme no <html>
// (ver globals.css — dark é o padrão, :root[data-theme="light"] sobrescreve).
// Persistido em localStorage; o script inline em app/layout.tsx aplica esse
// valor antes do primeiro paint pra evitar flash do tema errado.

"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light";
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      onClick={toggleTheme}
      aria-label="Alternar tema claro/escuro"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors ${
        isLight ? "bg-bg-elevated" : "bg-accent"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-transform ${
          isLight ? "bg-white translate-x-0.5" : "bg-bg translate-x-[1.375rem]"
        }`}
      >
        {isLight ? (
          <Sun size={12} strokeWidth={2} className="text-amber-500" />
        ) : (
          <Moon
            size={12}
            strokeWidth={2}
            fill="currentColor"
            className="text-amber-400"
          />
        )}
      </span>
    </button>
  );
}
