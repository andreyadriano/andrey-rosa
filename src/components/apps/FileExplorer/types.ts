// src/components/apps/FileExplorer/types.ts

export interface Preview {
  kind: "text" | "image";
  name: string;
  content?: string; // kind "text"
  src?: string; // kind "image"
}
