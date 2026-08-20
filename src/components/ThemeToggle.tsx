// src/components/ThemeToggle.tsx
//
// Alterna entre tema claro/escuro via atributo data-theme no <html>
// (ver globals.css — dark é o padrão, :root[data-theme="light"] sobrescreve).
// Persistido em localStorage; o script inline em app/layout.tsx aplica esse
// valor antes do primeiro paint pra evitar flash do tema errado.

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ThemeToggle() {
  // Default "dark" pra bater com o que o servidor sempre renderiza (ele
  // não sabe a preferência salva). Corrigido no useEffect abaixo, depois
  // que a hidratação já terminou — ler o DOM real (que o script anti-flash
  // do layout já pode ter marcado como "light" antes do primeiro paint)
  // direto no useState divergiria do HTML do servidor e geraria mismatch
  // de hydration nesse componente (ver AGENTS.md/layout.tsx pro caso
  // maior, no <html>, que tinha o mesmo problema).
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Sincroniza com o data-theme real do DOM (setado pelo script
    // anti-flash antes da hidratação). Tem que ser aqui, não no useState
    // acima — ler o DOM já no render inicial do cliente produziria um
    // resultado diferente do HTML do servidor (que não conhece a
    // preferência salva) e o React trataria como mismatch de hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
  }, []);

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
          <Sun size={12} strokeWidth={2} className="text-warn" />
        ) : (
          <Moon
            size={12}
            strokeWidth={2}
            fill="currentColor"
            className="text-warn"
          />
        )}
      </span>
    </button>
  );
}
