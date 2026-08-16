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
import type { ErrorMessages, HelpEntry, LogEntry, Row } from "./types";

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

// Substitui {cmd}/{arg} num template de erro vindo do dicionário.
function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

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
  errors: ErrorMessages;
}

export function useShell({
  id,
  prompt,
  bootCommand,
  bootLines,
  rows,
  fs,
  help,
  errors,
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
  // Espelha `cwd` de forma síncrona — necessário porque um "cd x && open y"
  // roda os dois comandos no mesmo tick, antes do re-render que aplicaria o
  // novo `cwd` vindo de setCwd(); sem isso, o "open" ainda enxergaria o cwd
  // antigo.
  const cwdRef = useRef(cwd);

  useEffect(() => {
    cwdRef.current = cwd;
  }, [cwd]);

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
    const node = getNode(fs, cwdRef.current);
    return node && node.type === "directory" ? node : fs;
  }

  interface CommandResult {
    output: React.ReactNode;
    ok: boolean;
  }

  function errorResult(message: string): CommandResult {
    return { output: <p className="text-fg-muted">{message}</p>, ok: false };
  }

  function runCommand(raw: string): CommandResult {
    const [cmdRaw, ...rest] = raw.trim().split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const argRaw = rest.join(" ").trim();
    const arg = argRaw.replace(/\/$/, "");

    if (cmd === "whoami") {
      return { output: <RowList rows={rows} />, ok: true };
    }

    if (cmd === "help") {
      return {
        output: (
          <RowList
            rows={help.map((entry) => ({ label: entry.cmd, value: entry.desc }))}
          />
        ),
        ok: true,
      };
    }

    if (cmd === "reboot") {
      window.location.reload();
      return { output: null, ok: true };
    }

    if (cmd === "ls") {
      const target = arg
        ? resolvePath(fs, cwdRef.current, arg)
        : { node: currentDir(), path: cwdRef.current };
      if (!target || target.node.type !== "directory") {
        return errorResult(format(errors.notFound, { cmd: "ls", arg: argRaw }));
      }
      return {
        output: (
          <div className="flex flex-wrap gap-x-5 gap-y-1 py-1 text-accent-2">
            {target.node.children.map((child) => (
              <span key={child.name}>
                {child.name}
                {child.type === "directory" ? "/" : ""}
              </span>
            ))}
          </div>
        ),
        ok: true,
      };
    }

    if (cmd === "cd") {
      if (!arg || arg === "home") {
        cwdRef.current = [];
        setCwd([]);
        return { output: null, ok: true };
      }
      const target = resolvePath(fs, cwdRef.current, arg);
      if (!target) {
        return errorResult(format(errors.notFound, { cmd: "cd", arg: argRaw }));
      }
      if (target.node.type !== "directory") {
        return errorResult(format(errors.notADirectory, { cmd: "cd", arg: argRaw }));
      }
      cwdRef.current = target.path;
      setCwd(target.path);
      return { output: null, ok: true };
    }

    if (cmd === "cat" || cmd === "open") {
      if (!arg) {
        return errorResult(format(errors.missingOperand, { cmd }));
      }
      const target = resolvePath(fs, cwdRef.current, arg);
      if (!target) {
        return errorResult(format(errors.notFound, { cmd, arg: argRaw }));
      }
      if (target.node.type === "directory") {
        return errorResult(format(errors.isADirectory, { cmd, arg: argRaw }));
      }

      const file = target.node;

      if (file.kind === "text") {
        return {
          output: (
            <p className="whitespace-pre-wrap text-fg-subtle">{file.content}</p>
          ),
          ok: true,
        };
      }

      if (cmd === "cat") {
        return errorResult(format(errors.useOpen, { arg: argRaw }));
      }

      // open
      if (file.kind === "link" && file.href) {
        if (file.href.startsWith("/")) {
          router.push(file.href);
        } else {
          window.open(file.href, "_blank", "noreferrer");
        }
        return { output: null, ok: true };
      }
      if (file.kind === "image" && file.src) {
        // Placeholder até o Explorador de Arquivos ter um visualizador de
        // verdade — por enquanto só abre a imagem em outra aba.
        window.open(file.src, "_blank", "noreferrer");
        return { output: null, ok: true };
      }
      return { output: null, ok: true };
    }

    return errorResult(format(errors.commandNotFound, { cmd: cmdRaw }));
  }

  // Suporta "cmd1 && cmd2 && ..." como um shell de verdade: cada comando só
  // roda se o anterior teve sucesso, e a saída de todos é concatenada sob a
  // mesma linha de comando digitada (não ecoa cada parte separadamente).
  function runChain(raw: string): React.ReactNode {
    const parts = raw.split(/\s*&&\s*/).filter((part) => part.trim().length > 0);
    const outputs: React.ReactNode[] = [];

    for (const part of parts) {
      const result = runCommand(part);
      if (result.output) outputs.push(result.output);
      if (!result.ok) break;
    }

    if (outputs.length === 0) return null;
    if (outputs.length === 1) return outputs[0];
    return (
      <>
        {outputs.map((output, i) => (
          <div key={i}>{output}</div>
        ))}
      </>
    );
  }

  // Autocompleta um único comando (sem "&&") — chamado sobre o último
  // segmento de uma cadeia, ver autocomplete() abaixo.
  function completeSegment(segment: string): { value: string; list?: string[] } {
    const spaceIndex = segment.indexOf(" ");

    if (spaceIndex === -1) {
      const prefix = segment.toLowerCase();
      const matches = COMMANDS.filter((c) => c.startsWith(prefix));
      if (matches.length === 0) return { value: segment };
      if (matches.length === 1) {
        const needsArg = COMMANDS_WITH_FILE_ARG.includes(matches[0]);
        return { value: needsArg ? `${matches[0]} ` : matches[0] };
      }
      const common = longestCommonPrefix(matches);
      if (common.length > prefix.length) return { value: common };
      return { value: segment, list: matches };
    }

    const cmd = segment.slice(0, spaceIndex).toLowerCase();
    const argPrefix = segment.slice(spaceIndex + 1).toLowerCase();
    if (!COMMANDS_WITH_FILE_ARG.includes(cmd)) return { value: segment };

    const matches = currentDir()
      .children.map((child) => child.name)
      .filter((name) => name.toLowerCase().startsWith(argPrefix));
    if (matches.length === 0) return { value: segment };
    if (matches.length === 1) return { value: `${cmd} ${matches[0]}` };
    const common = longestCommonPrefix(matches.map((m) => m.toLowerCase()));
    if (common.length > argPrefix.length) return { value: `${cmd} ${common}` };
    return { value: segment, list: matches };
  }

  // Tab também funciona depois de um "&&": só o último comando da cadeia é
  // autocompletado, o resto da linha já digitada fica intacto — mesmo
  // comportamento do bash pra `cmd1 && cmd2<Tab>`.
  function autocomplete(value: string): { value: string; list?: string[] } {
    const match = value.match(/^(.*&&\s*)([^&]*)$/);
    const prefix = match ? match[1] : "";
    const segment = match ? match[2] : value;

    const result = completeSegment(segment);
    return { value: prefix + result.value, list: result.list };
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

    const output = runChain(value);
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
    cwdRef.current = [];
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
