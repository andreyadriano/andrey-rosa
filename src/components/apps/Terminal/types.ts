// src/components/apps/Terminal/types.ts

export interface Row {
  label: string;
  value: React.ReactNode;
}

export interface LogEntry {
  id: string;
  type: "cmd" | "output";
  content: React.ReactNode;
}

export interface HelpEntry {
  cmd: string;
  desc: string;
}

// Templates de mensagem de erro, com placeholders {cmd}/{arg} substituídos
// em runtime (ver format() em useShell.tsx) — internacionalizadas porque
// vêm do dicionário, não hardcoded em uma língua só.
export interface ErrorMessages {
  notFound: string;
  notADirectory: string;
  missingOperand: string;
  isADirectory: string;
  useOpen: string;
  commandNotFound: string;
}
