// src/components/TerminalWindow.tsx
//
// Terminal interativo, montado uma vez em src/app/[lang]/layout.tsx — vive
// acima de qualquer página, não é mais preso ao Hero. Abre sozinho (boot
// log -> digita "whoami" -> mostra os dados -> fica pronto pra comandos)
// quando a página carrega, flutuando no centro da tela. Uma barra de
// tarefas fixa no rodapé fica sempre visível; clicar nela minimiza a
// janela aberta ou reabre uma fechada/minimizada, centralizada.
//
// Nunca desmonta enquanto a aba estiver aberta (o layout persiste entre
// navegações internas), então o log de comandos e a posição da janela
// sobrevivem trocando de página.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Maximize2,
  Minimize2,
  Minus,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";
import type { Lang } from "@/types";

const BOOT_LINE_DELAY_MS = 650;
const TYPE_CHAR_DELAY_MS = 90;
const POST_TYPE_DELAY_MS = 500;

const DEFAULT_FLOAT_WIDTH = 520;
const DEFAULT_FLOAT_HEIGHT = 420;
const MIN_FLOAT_WIDTH = 280;
const MIN_FLOAT_HEIGHT = 200;

type Mode = "floating" | "maximized" | "minimized" | "closed";
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Row {
  label: string;
  value: React.ReactNode;
}

interface LogEntry {
  id: string;
  type: "cmd" | "output";
  content: React.ReactNode;
}

interface TerminalPage {
  slug: string;
  label: string;
}

interface HelpEntry {
  cmd: string;
  desc: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TerminalWindowProps {
  lang: Lang;
  prompt: string;
  bootCommand: string;
  bootLines: string[];
  rows: Row[];
  pages: TerminalPage[];
  help: HelpEntry[];
}

interface PersistedState {
  phase: "boot" | "typing" | "ready";
  bootShown: number;
  typedLen: number;
  log: LogEntry[];
  input: string;
  history: string[];
  historyIndex: number | null;
  mode: Mode;
  rect: Rect | null;
  preMaximizeRect: Rect | null;
}

// Troca de idioma (/pt <-> /en) remonta o layout ([lang]/layout.tsx) e,
// com ele, este componente — mesmo sendo o mesmo terminal conceitualmente.
// Guardar o estado aqui, fora do React, é o que faz ele sobreviver a esse
// remount sem resetar (só um reboot/F5 de verdade deve limpar o boot).
let persistedState: PersistedState | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const COMMANDS = ["ls", "cd", "whoami", "clear", "reboot", "help"];

function longestCommonPrefix(options: string[]): string {
  if (options.length === 0) return "";
  let prefix = options[0];
  for (const option of options.slice(1)) {
    while (!option.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
}

// Autocomplete estilo shell: Tab completa até o prefixo comum entre as
// opções que baterem; se sobrar mais de uma opção sem prefixo comum maior,
// devolve a lista pra imprimir no terminal (igual duplo-Tab do bash).
function autocomplete(
  value: string,
  pages: TerminalPage[],
): { value: string; list?: string[] } {
  const spaceIndex = value.indexOf(" ");

  if (spaceIndex === -1) {
    const prefix = value.toLowerCase();
    const matches = COMMANDS.filter((c) => c.startsWith(prefix));
    if (matches.length === 0) return { value };
    if (matches.length === 1) {
      return { value: matches[0] === "cd" ? "cd " : matches[0] };
    }
    const common = longestCommonPrefix(matches);
    if (common.length > prefix.length) return { value: common };
    return { value, list: matches };
  }

  const cmd = value.slice(0, spaceIndex).toLowerCase();
  const argPrefix = value.slice(spaceIndex + 1).toLowerCase();
  if (cmd !== "cd") return { value };

  const matches = pages
    .map((p) => p.slug)
    .filter((slug) => slug.startsWith(argPrefix));
  if (matches.length === 0) return { value };
  if (matches.length === 1) return { value: `cd ${matches[0]}` };
  const common = longestCommonPrefix(matches);
  if (common.length > argPrefix.length) return { value: `cd ${common}` };
  return { value, list: matches };
}

function getCenteredRect(): Rect {
  const width = Math.min(DEFAULT_FLOAT_WIDTH, window.innerWidth - 32);
  const height = Math.min(DEFAULT_FLOAT_HEIGHT, window.innerHeight - 32);
  return {
    x: Math.max(16, (window.innerWidth - width) / 2),
    y: Math.max(16, (window.innerHeight - height) / 2),
    width,
    height,
  };
}

function RowList({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 py-1">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-fg-muted">{row.label}</dt>
          <dd className="text-fg-subtle">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TerminalWindow({
  lang,
  prompt,
  bootCommand,
  bootLines,
  rows,
  pages,
  help,
}: TerminalWindowProps) {
  const router = useRouter();
  const windowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Captura, uma vez só, se essa instância nasceu de um remount (troca de
  // idioma) ou é a primeira montagem de verdade — decide se os efeitos de
  // "primeira abertura" (centralizar, pular boot) devem rodar.
  const isFreshMount = useRef(persistedState === null);

  // --- shell (comandos/boot) ---
  const [phase, setPhase] = useState<"boot" | "typing" | "ready">(
    () => persistedState?.phase ?? "boot",
  );
  const [bootShown, setBootShown] = useState(
    () => persistedState?.bootShown ?? 0,
  );
  const [typedLen, setTypedLen] = useState(() => persistedState?.typedLen ?? 0);
  const [log, setLog] = useState<LogEntry[]>(() => persistedState?.log ?? []);
  const [input, setInput] = useState(() => persistedState?.input ?? "");
  const [history, setHistory] = useState<string[]>(
    () => persistedState?.history ?? [],
  );
  const [historyIndex, setHistoryIndex] = useState<number | null>(
    () => persistedState?.historyIndex ?? null,
  );

  // --- janela ---
  const [mode, setMode] = useState<Mode>(
    () => persistedState?.mode ?? "floating",
  );
  const [rect, setRect] = useState<Rect | null>(
    () => persistedState?.rect ?? null,
  );
  const [preMaximizeRect, setPreMaximizeRect] = useState<Rect | null>(
    () => persistedState?.preMaximizeRect ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Evita selecionar texto da página sem querer enquanto arrasta/redimensiona.
  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [isDragging, isResizing]);
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
  // sobreviver a um remount (ver comentário de PersistedState acima).
  useEffect(() => {
    persistedState = {
      phase,
      bootShown,
      typedLen,
      log,
      input,
      history,
      historyIndex,
      mode,
      rect,
      preMaximizeRect,
    };
  });

  // Abre centralizada assim que monta de verdade (client-side, precisa de
  // window.innerWidth/Height) — numa troca de idioma, mantém a posição
  // restaurada.
  useEffect(() => {
    if (!isFreshMount.current) return;
    const t = setTimeout(() => setRect(getCenteredRect()), 0);
    return () => clearTimeout(t);
  }, []);

  // Pula a animação de boot só se o visitante prefere menos movimento na
  // tela — toda vez que a página carrega de verdade (ou o comando "reboot"
  // recarrega a página), o boot toca de novo, igual um computador de
  // verdade. Numa troca de idioma (remount, não reload) não deve rodar.
  useEffect(() => {
    if (!isFreshMount.current) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reduceMotion) return;

    const t = setTimeout(() => {
      setBootShown(bootLines.length);
      setTypedLen(bootCommand.length);
      setLog([
        { id: "boot-cmd", type: "cmd", content: bootCommand },
        { id: "boot-out", type: "output", content: <RowList rows={rows} /> },
      ]);
      setPhase("ready");
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "boot") return;
    if (bootShown >= bootLines.length) {
      const t = setTimeout(() => setPhase("typing"), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBootShown((n) => n + 1), BOOT_LINE_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, bootShown, bootLines.length]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (typedLen >= bootCommand.length) {
      const t = setTimeout(() => {
        setLog([
          { id: "boot-cmd", type: "cmd", content: bootCommand },
          {
            id: "boot-out",
            type: "output",
            content: <RowList rows={rows} />,
          },
        ]);
        setPhase("ready");
      }, POST_TYPE_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLen((n) => n + 1), TYPE_CHAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, typedLen, bootCommand, rows]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log, phase]);

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
          MIN_FLOAT_WIDTH,
          window.innerWidth - originX - 16,
        );
      }
      if (dir.includes("s")) {
        height = clamp(
          originH + dy,
          MIN_FLOAT_HEIGHT,
          window.innerHeight - originY - 16,
        );
      }
      if (dir.includes("w")) {
        const rightEdge = originX + originW;
        x = clamp(originX + dx, 16, rightEdge - MIN_FLOAT_WIDTH);
        width = rightEdge - x;
      }
      if (dir.includes("n")) {
        const bottomEdge = originY + originH;
        y = clamp(originY + dy, 16, bottomEdge - MIN_FLOAT_HEIGHT);
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
  }, [isResizing]);

  function handleTitlebarPointerDown(e: React.PointerEvent) {
    let originRect = rect ?? getCenteredRect();

    if (mode === "maximized") {
      originRect = preMaximizeRect ?? getCenteredRect();
      setRect(originRect);
      setPreMaximizeRect(null);
      setMode("floating");
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: originRect.x,
      originY: originRect.y,
    };
    setIsDragging(true);
  }

  function handleResizePointerDown(e: React.PointerEvent, dir: ResizeDir) {
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
      setMode("floating");
      return;
    }
    setPreMaximizeRect(rect ?? getCenteredRect());
    setMode("maximized");
  }

  function close() {
    setMode("closed");
    // Fechar limpa o terminal (diferente de minimizar, que preserva tudo),
    // mas sem tocar o boot de novo — isso só acontece ao recarregar a
    // página (F5 ou o comando "reboot"). Também esquece a posição, pra
    // reabrir centralizada de novo, como se fosse a primeira vez.
    setPhase("ready");
    setLog([]);
    setInput("");
    setHistory([]);
    setHistoryIndex(null);
    setRect(null);
    setPreMaximizeRect(null);
  }

  function handleTaskbarClick() {
    if (mode === "floating" || mode === "maximized") {
      minimize();
      return;
    }
    // Ao reabrir, mantém a posição anterior (se já teve uma); só centraliza
    // na primeiríssima abertura, quando ainda não existe posição alguma.
    if (!rect) setRect(getCenteredRect());
    setMode("floating");
  }

  function runCommand(raw: string): React.ReactNode {
    const [cmdRaw, ...rest] = raw.trim().split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const arg = rest.join(" ").replace(/\/$/, "").toLowerCase();

    if (cmd === "whoami") {
      return <RowList rows={rows} />;
    }

    if (cmd === "ls") {
      return (
        <div className="flex flex-wrap gap-x-5 gap-y-1 py-1 text-accent-2">
          {pages.map((page) => (
            <span key={page.slug}>{page.slug}/</span>
          ))}
        </div>
      );
    }

    if (cmd === "cd") {
      if (
        !arg ||
        arg === ".." ||
        arg === "/" ||
        arg === "~" ||
        arg === "home"
      ) {
        router.push(`/${lang}`);
        return null;
      }
      const page = pages.find((p) => p.slug === arg);
      if (page) {
        router.push(`/${lang}/${page.slug}`);
        return null;
      }
      return (
        <p className="text-fg-muted">
          cd: {rest.join(" ")}: No such file or directory
        </p>
      );
    }

    if (cmd === "help") {
      return (
        <RowList
          rows={help.map((entry) => ({ label: entry.cmd, value: entry.desc }))}
        />
      );
    }

    if (cmd === "reboot") {
      window.location.reload();
      return null;
    }

    return <p className="text-fg-muted">bash: {cmdRaw}: command not found</p>;
  }

  function handleSubmit() {
    const value = input;

    if (!value.trim()) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setLog((prev) => [...prev, { id, type: "cmd", content: "" }]);
      setInput("");
      return;
    }

    setHistory((prev) => [...prev, value]);
    setHistoryIndex(null);
    setInput("");

    if (value.trim().toLowerCase() === "clear") {
      setLog([]);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLog((prev) => [...prev, { id, type: "cmd", content: value }]);

    const output = runCommand(value);
    if (output) {
      setLog((prev) => [
        ...prev,
        { id: `${id}-out`, type: "output", content: output },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setLog([]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const result = autocomplete(input, pages);
      if (result.value !== input) {
        setInput(result.value);
      }
      if (result.list && result.list.length > 0) {
        const list = result.list;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setLog((prev) => [
          ...prev,
          {
            id,
            type: "output",
            content: (
              <div className="flex flex-wrap gap-x-4 gap-y-1 py-1 text-fg-muted">
                {list.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ),
          },
        ]);
      }
    } else if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex =
        historyIndex === null
          ? history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    }
  }

  const isOpen = rect !== null && (mode === "floating" || mode === "maximized");

  const windowStyle: React.CSSProperties | undefined =
    mode === "maximized"
      ? { position: "fixed", inset: "5vh 5vw", zIndex: 10000 }
      : rect
        ? {
            position: "fixed",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            zIndex: 10000,
          }
        : undefined;

  const controlButtonBase =
    "flex h-5 w-5 items-center justify-center rounded-full transition-colors";

  return (
    <>
      {isOpen && (
        <div
          ref={windowRef}
          style={windowStyle}
          className="fixed flex flex-col rounded-lg border border-border bg-bg-elevated font-mono text-xs md:text-[0.8125rem] shadow-2xl overflow-hidden"
        >
          <div
            onPointerDown={handleTitlebarPointerDown}
            className="flex items-center gap-2 border-b border-border px-3 py-2 select-none touch-none cursor-move"
          >
            <span className="text-[0.6875rem] text-fg-muted">terminal</span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={minimize}
                aria-label="Minimizar terminal"
                title="Minimizar"
                className={`${controlButtonBase} bg-warn text-warn-fg hover:bg-warn-hover`}
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggleMaximize}
                aria-label={
                  mode === "maximized"
                    ? "Restaurar terminal"
                    : "Maximizar terminal"
                }
                title={mode === "maximized" ? "Restaurar" : "Maximizar"}
                className={`${controlButtonBase} bg-accent text-accent-fg hover:bg-accent-hover`}
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
                onClick={close}
                aria-label="Fechar terminal"
                title="Fechar"
                className={`${controlButtonBase} bg-danger text-danger-fg hover:bg-danger-hover`}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            onClick={() => phase === "ready" && inputRef.current?.focus()}
            className="flex-1 min-h-0 px-4 py-3 overflow-y-auto"
          >
            {phase === "boot" &&
              bootLines.slice(0, bootShown).map((line) => (
                <p key={line} className="text-fg-muted">
                  {line}
                </p>
              ))}

            {phase === "typing" && (
              <p className="text-accent-2">
                {prompt}{" "}
                <span className="text-fg">
                  {bootCommand.slice(0, typedLen)}
                  <span className="animate-pulse">▌</span>
                </span>
              </p>
            )}

            {phase === "ready" && (
              <>
                {log.map((entry) =>
                  entry.type === "cmd" ? (
                    <p key={entry.id} className="text-accent-2">
                      {prompt} <span className="text-fg">{entry.content}</span>
                    </p>
                  ) : (
                    <div key={entry.id}>{entry.content}</div>
                  ),
                )}

                <div className="flex items-center gap-2 text-accent-2">
                  <span>{prompt}</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    aria-label={prompt}
                    placeholder="help"
                    className="flex-1 min-w-0 bg-transparent text-fg outline-none placeholder:text-fg-muted/60"
                  />
                </div>
              </>
            )}
          </div>

          {mode === "floating" && (
            <>
              {/* bordas */}
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "n")}
                className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize touch-none"
                aria-hidden="true"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "s")}
                className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize touch-none"
                aria-hidden="true"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "w")}
                className="absolute -left-1 top-2 bottom-2 w-2 cursor-ew-resize touch-none"
                aria-hidden="true"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "e")}
                className="absolute -right-1 top-2 bottom-2 w-2 cursor-ew-resize touch-none"
                aria-hidden="true"
              />
              {/* cantos, por cima das bordas */}
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "nw")}
                className="absolute -top-1 -left-1 h-3 w-3 cursor-nwse-resize touch-none"
                aria-hidden="true"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "ne")}
                className="absolute -top-1 -right-1 h-3 w-3 cursor-nesw-resize touch-none"
                aria-hidden="true"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "sw")}
                className="absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize touch-none"
                aria-hidden="true"
              />
              <div
                onPointerDown={(e) => handleResizePointerDown(e, "se")}
                className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize touch-none"
                aria-hidden="true"
              />
            </>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-[9999] border-t border-border bg-bg/80 backdrop-blur px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center">
          <button
            type="button"
            onClick={handleTaskbarClick}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
              mode === "floating" || mode === "maximized"
                ? "border-accent/40 bg-surface-hover text-fg"
                : "border-border bg-surface text-fg hover:border-accent/40 hover:bg-surface-hover"
            }`}
          >
            <TerminalIcon size={14} strokeWidth={1.75} />
            terminal
          </button>
        </div>
      </div>
    </>
  );
}
