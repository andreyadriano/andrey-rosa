// src/lib/vfs/path.ts
//
// Resolução de caminhos sobre a árvore do VFS — puro, sem I/O. Comparação
// de nomes é case-sensitive (como um filesystem Linux de verdade); quem
// chama já normaliza a entrada do usuário pra minúsculo se quiser.

import type { VfsDirectory, VfsNode } from "./types";

function findChild(dir: VfsDirectory, name: string): VfsNode | undefined {
  return dir.children.find((child) => child.name === name);
}

export function getNode(root: VfsDirectory, path: string[]): VfsNode | null {
  let node: VfsNode = root;
  for (const segment of path) {
    if (node.type !== "directory") return null;
    const child = findChild(node, segment);
    if (!child) return null;
    node = child;
  }
  return node;
}

export function listChildren(dir: VfsDirectory): VfsNode[] {
  return dir.children;
}

export function formatCwd(cwd: string[]): string {
  return cwd.length === 0 ? "~" : `~/${cwd.join("/")}`;
}

export interface ResolvedPath {
  node: VfsNode;
  path: string[];
}

// Resolve "." / ".." / "/" / "~" / nomes relativos e absolutos a partir de
// `cwd`. Devolve null se algum segmento não existir.
export function resolvePath(
  root: VfsDirectory,
  cwd: string[],
  input: string,
): ResolvedPath | null {
  const isAbsolute = input.startsWith("/") || input.startsWith("~");
  const segments = input
    .replace(/^~/, "")
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let path = isAbsolute ? [] : [...cwd];
  let node = getNode(root, path);
  if (!node) return null;

  for (const segment of segments) {
    if (segment === ".") continue;
    if (segment === "..") {
      path = path.slice(0, -1);
      const parent = getNode(root, path);
      if (!parent) return null;
      node = parent;
      continue;
    }
    if (node.type !== "directory") return null;
    const child = findChild(node, segment);
    if (!child) return null;
    path = [...path, child.name];
    node = child;
  }

  return { node, path };
}
