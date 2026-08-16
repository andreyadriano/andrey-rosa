// src/components/apps/Terminal/useShell.ts
//
// Emulação de shell: boot -> digita o comando de boot sozinho -> mostra os
// dados -> fica pronto pra comandos de verdade (ls/cd/cat/open/whoami/
// clear/reboot/help), navegando o VFS simulado (src/lib/vfs). Persistência
// entre remounts de troca de idioma segue o mesmo padrão de useWindow.ts —
// aqui por conta própria porque o shell é um estado independente da janela
// (minimizar preserva tudo; fechar limpa só o shell, não a janela).

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCwd, getNode, resolvePath } from "@/lib/vfs/path";
import type { VfsDirectory } from "@/lib/vfs/types";
import { RowList } from "./RowList";
import type { HelpEntry, LogEntry, Row } from "./types";

const BOOT_LINE_DELAY_MS = 650;
const TYPE_CHAR_DELAY_MS = 90;
const POST_TYPE_DELAY_MS = 500;

const COMMANDS = ["ls", "cd", "cat", "open", "whoami", "clear", "reboot", "help"];
const COMMANDS_WITH_FILE_ARG = ["cd", "cat", "open", "ls"];

interface ShellPersistedState {
  phase: "boot" | "typing" | "ready";
  bootShown: number;
  typedLen: number;
  log: LogEntry[];
  input: string;
  history: string[];
  historyIndex: number | null;
  cwd: string[];
}

const persistedShells = new Map<string, ShellPersistedState>();

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

interface UseShellOptions {
  id: string;
  prompt: string;
  bootCommand: string;
  bootLines: string[];
  rows: Row[];
  fs: VfsDirectory;
  help: HelpEntry[];
}

export function useShell({
  id,
  prompt,
  bootCommand,
  bootLines,
  rows,
  fs,
  help,
}: UseShellOptions) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const persisted = persistedShells.get(id);
  const isFreshMount = useRef(persisted === undefined);

  const [phase, setPhase] = useState<"boot" | "typing" | "ready">(
    () => persisted?.phase ?? "boot",
  );
  const [bootShown, setBootShown] = useState(() => persisted?.bootShown ?? 0);
  const [typedLen, setTypedLen] = useState(() => persisted?.typedLen ?? 0);
  const [log, setLog] = useState<LogEntry[]>(() => persisted?.log ?? []);
  const [input, setInput] = useState(() => persisted?.input ?? "");
  const [history, setHistory] = useState<string[]>(
    () => persisted?.history ?? [],
  );
  const [historyIndex, setHistoryIndex] = useState<number | null>(
    () => persisted?.historyIndex ?? null,
  );
  const [cwd, setCwd] = useState<string[]>(() => persisted?.cwd ?? []);

  useEffect(() => {
    persistedShells.set(id, {
      phase,
      bootShown,
      typedLen,
      log,
      input,
      history,
      historyIndex,
      cwd,
    });
  });

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
          { id: "boot-out", type: "output", content: <RowList rows={rows} /> },
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

  function currentDir(): VfsDirectory {
    const node = getNode(fs, cwd);
    return node && node.type === "directory" ? node : fs;
  }

  function runCommand(raw: string): React.ReactNode {
    const [cmdRaw, ...rest] = raw.trim().split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const argRaw = rest.join(" ").trim();
    const arg = argRaw.replace(/\/$/, "");

    if (cmd === "whoami") {
      return <RowList rows={rows} />;
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

    if (cmd === "ls") {
      const target = arg ? resolvePath(fs, cwd, arg) : { node: currentDir(), path: cwd };
      if (!target || target.node.type !== "directory") {
        return (
          <p className="text-fg-muted">
            ls: {argRaw}: No such file or directory
          </p>
        );
      }
      return (
        <div className="flex flex-wrap gap-x-5 gap-y-1 py-1 text-accent-2">
          {target.node.children.map((child) => (
            <span key={child.name}>
              {child.name}
              {child.type === "directory" ? "/" : ""}
            </span>
          ))}
        </div>
      );
    }

    if (cmd === "cd") {
      if (!arg || arg === "home") {
        setCwd([]);
        return null;
      }
      const target = resolvePath(fs, cwd, arg);
      if (!target) {
        return (
          <p className="text-fg-muted">
            cd: {argRaw}: No such file or directory
          </p>
        );
      }
      if (target.node.type !== "directory") {
        return <p className="text-fg-muted">cd: {argRaw}: Not a directory</p>;
      }
      setCwd(target.path);
      return null;
    }

    if (cmd === "cat" || cmd === "open") {
      if (!arg) {
        return <p className="text-fg-muted">{cmd}: missing file operand</p>;
      }
      const target = resolvePath(fs, cwd, arg);
      if (!target) {
        return (
          <p className="text-fg-muted">
            {cmd}: {argRaw}: No such file or directory
          </p>
        );
      }
      if (target.node.type === "directory") {
        return (
          <p className="text-fg-muted">
            {cmd}: {argRaw}: Is a directory
          </p>
        );
      }

      const file = target.node;

      if (file.kind === "text") {
        return <p className="whitespace-pre-wrap text-fg-subtle">{file.content}</p>;
      }

      if (cmd === "cat") {
        return (
          <p className="text-fg-muted">
            cat: {argRaw}: use &quot;open&quot; pra abrir este arquivo
          </p>
        );
      }

      // open
      if (file.kind === "link" && file.href) {
        if (file.href.startsWith("/")) {
          router.push(file.href);
        } else {
          window.open(file.href, "_blank", "noreferrer");
        }
        return null;
      }
      if (file.kind === "image" && file.src) {
        // Placeholder até o Explorador de Arquivos ter um visualizador de
        // verdade — por enquanto só abre a imagem em outra aba.
        window.open(file.src, "_blank", "noreferrer");
        return null;
      }
      return null;
    }

    return <p className="text-fg-muted">bash: {cmdRaw}: command not found</p>;
  }

  function autocomplete(value: string): { value: string; list?: string[] } {
    const spaceIndex = value.indexOf(" ");

    if (spaceIndex === -1) {
      const prefix = value.toLowerCase();
      const matches = COMMANDS.filter((c) => c.startsWith(prefix));
      if (matches.length === 0) return { value };
      if (matches.length === 1) {
        const needsArg = COMMANDS_WITH_FILE_ARG.includes(matches[0]);
        return { value: needsArg ? `${matches[0]} ` : matches[0] };
      }
      const common = longestCommonPrefix(matches);
      if (common.length > prefix.length) return { value: common };
      return { value, list: matches };
    }

    const cmd = value.slice(0, spaceIndex).toLowerCase();
    const argPrefix = value.slice(spaceIndex + 1).toLowerCase();
    if (!COMMANDS_WITH_FILE_ARG.includes(cmd)) return { value };

    const matches = currentDir()
      .children.map((child) => child.name)
      .filter((name) => name.toLowerCase().startsWith(argPrefix));
    if (matches.length === 0) return { value };
    if (matches.length === 1) return { value: `${cmd} ${matches[0]}` };
    const common = longestCommonPrefix(matches.map((m) => m.toLowerCase()));
    if (common.length > argPrefix.length) return { value: `${cmd} ${common}` };
    return { value, list: matches };
  }

  function handleSubmit() {
    const value = input;

    if (!value.trim()) {
      const entryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setLog((prev) => [...prev, { id: entryId, type: "cmd", content: "" }]);
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

    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLog((prev) => [...prev, { id: entryId, type: "cmd", content: value }]);

    const output = runCommand(value);
    if (output) {
      setLog((prev) => [
        ...prev,
        { id: `${entryId}-out`, type: "output", content: output },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setLog([]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const result = autocomplete(input);
      if (result.value !== input) {
        setInput(result.value);
      }
      if (result.list && result.list.length > 0) {
        const list = result.list;
        const entryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setLog((prev) => [
          ...prev,
          {
            id: entryId,
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

  // Fechar a janela limpa o shell (diferente de minimizar, que preserva
  // tudo), mas sem tocar o boot de novo — isso só acontece ao recarregar a
  // página (F5 ou o comando "reboot").
  function reset() {
    setPhase("ready");
    setLog([]);
    setInput("");
    setHistory([]);
    setHistoryIndex(null);
    setCwd([]);
  }

  const promptDisplay = `${prompt}:${formatCwd(cwd)}$`;

  return {
    phase,
    bootShown,
    typedLen,
    bootLines,
    bootCommand,
    log,
    input,
    setInput,
    handleKeyDown,
    promptDisplay,
    inputRef,
    scrollRef,
    reset,
  };
}
