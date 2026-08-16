// src/lib/vfs/build.ts
//
// Monta a árvore do VFS lendo arquivos de verdade em disco — mesmo padrão
// de src/lib/blog.ts (fs.readdirSync sem CMS/banco). Tudo mora dentro de
// public/vfs/ (precisa ser público pra imagem virar <img src> de verdade):
//   public/vfs/{lang}/   — texto (.txt) e "atalhos" (.link), por idioma
//   public/vfs/assets/   — imagens, compartilhadas entre os idiomas,
//                          mescladas na raiz da árvore
// Adicionar um arquivo novo (texto, link ou imagem) é só soltar ele na
// pasta certa — não precisa mexer em código nenhum.

import fs from "node:fs";
import path from "node:path";
import type { Lang } from "@/types";
import type { VfsDirectory, VfsNode } from "./types";

const PUBLIC_VFS_DIR = path.join(process.cwd(), "public/vfs");
const ASSETS_DIR = path.join(PUBLIC_VFS_DIR, "assets");
const ASSETS_URL_PREFIX = "/vfs/assets";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

function compareNodes(a: VfsNode, b: VfsNode): number {
  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

// Lê uma pasta recursivamente reconhecendo os três tipos de arquivo pelo
// nome/extensão: .txt (texto), .link (atalho — conteúdo é uma URL/rota) e
// imagens (viram <img src>, usando `urlPrefix` pra montar o caminho público
// real do arquivo).
function readTree(dir: string, urlPrefix: string): VfsNode[] {
  if (!fs.existsSync(dir)) return [];

  const nodes: VfsNode[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const entryUrl = `${urlPrefix}/${entry.name}`;

    if (entry.isDirectory()) {
      nodes.push({
        type: "directory",
        name: entry.name,
        children: readTree(entryPath, entryUrl),
      });
      continue;
    }

    if (entry.name.endsWith(".txt")) {
      nodes.push({
        type: "file",
        name: entry.name,
        kind: "text",
        content: fs.readFileSync(entryPath, "utf8").trim(),
      });
      continue;
    }

    if (entry.name.endsWith(".link")) {
      nodes.push({
        type: "file",
        name: entry.name,
        kind: "link",
        href: fs.readFileSync(entryPath, "utf8").trim(),
      });
      continue;
    }

    if (IMAGE_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
      nodes.push({ type: "file", name: entry.name, kind: "image", src: entryUrl });
    }
  }

  return nodes.sort(compareNodes);
}

// Mescla duas listas de nós pelo `name`; diretórios com o mesmo nome nos
// dois lados têm os filhos combinados recursivamente (é assim que uma
// imagem em public/vfs/assets/projects/ aparece dentro do mesmo projects/
// que tem texto em public/vfs/{lang}/projects/).
function mergeTrees(a: VfsNode[], b: VfsNode[]): VfsNode[] {
  const byName = new Map<string, VfsNode>();
  for (const node of a) byName.set(node.name, node);

  for (const node of b) {
    const existing = byName.get(node.name);
    if (existing && existing.type === "directory" && node.type === "directory") {
      byName.set(node.name, {
        type: "directory",
        name: node.name,
        children: mergeTrees(existing.children, node.children),
      });
    } else {
      byName.set(node.name, node);
    }
  }

  return Array.from(byName.values()).sort(compareNodes);
}

export function buildFileSystem(lang: Lang): VfsDirectory {
  const langNodes = readTree(path.join(PUBLIC_VFS_DIR, lang), `/vfs/${lang}`);
  const sharedNodes = readTree(ASSETS_DIR, ASSETS_URL_PREFIX);

  return {
    type: "directory",
    name: "/",
    children: mergeTrees(langNodes, sharedNodes),
  };
}
