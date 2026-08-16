// src/lib/vfs/types.ts
//
// Sistema de arquivos simulado do terminal — árvore de diretórios/arquivos
// construída a partir de arquivos de verdade em src/content/vfs/{lang}/
// (texto/link) e public/vfs/ (imagem). Ver build.ts.

export interface VfsDirectory {
  type: "directory";
  name: string;
  children: VfsNode[];
}

export interface VfsFile {
  type: "file";
  name: string;
  kind: "text" | "image" | "link";
  content?: string; // kind "text": conteúdo do .txt
  href?: string; // kind "link": conteúdo do .link (URL/rota)
  src?: string; // kind "image": caminho público (/vfs/...)
}

export type VfsNode = VfsDirectory | VfsFile;
