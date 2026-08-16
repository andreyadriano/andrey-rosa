// src/components/apps/Terminal/RowList.tsx
//
// Lista label/valor usada pelo whoami, ls, help.

import type { Row } from "./types";

export function RowList({ rows }: { rows: Row[] }) {
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
