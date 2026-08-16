// src/components/apps/FileExplorer/FileIcon.tsx
//
// Ícone por tipo de nó do VFS — mesma árvore que o Terminal navega, só que
// aqui mostrada visualmente em vez de por comando.

import { FileText, Folder, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import type { VfsNode } from "@/lib/vfs/types";

interface FileIconProps {
  node: VfsNode;
  size?: number;
}

export function FileIcon({ node, size = 28 }: FileIconProps) {
  if (node.type === "directory") {
    return <Folder size={size} strokeWidth={1.5} className="text-accent" />;
  }
  if (node.kind === "image") {
    return <ImageIcon size={size} strokeWidth={1.5} className="text-accent-2" />;
  }
  if (node.kind === "link") {
    return <LinkIcon size={size} strokeWidth={1.5} className="text-accent-2" />;
  }
  return <FileText size={size} strokeWidth={1.5} className="text-fg-muted" />;
}
