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
