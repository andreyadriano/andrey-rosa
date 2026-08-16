# Desenvolvimento

Guia prático pra rodar o projeto e mexer no conteúdo. Pra uma visão geral do que o site faz, veja o [README](README.md);
pra decisões de arquitetura e convenções internas, veja [AGENTS.md](AGENTS.md).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — o `/` redireciona para `/pt`.

## Adicionando um novo projeto

Os projetos vivem em [`src/data/projects.ts`](src/data/projects.ts), um objeto `Record<Lang, Project[]>` com uma entrada
em `pt` e outra em `en`. Para adicionar um projeto, adicione um item em **ambos** os arrays:

```ts
{
  title: "Nome do projeto",
  date: "2026-08-15",       // AAAA-MM-DD — usado pra ordenar
  featured: true,            // aparece nos "Projetos em destaque" da home?
  description: "Descrição curta (cabe em ~3 linhas no card).",
  tags: ["Go", "React"],
  links: [
    {
      label: "Visitar",
      href: "https://...",
      variant: "primary",    // "primary" (botão verde) ou "secondary" (contorno)
      icon: "external",      // "external" ou "github"
    },
  ],
}
```

- A página **`/projects`** sempre lista todos os projetos, marcados como destaque ou não.
- A seção **"Projetos em destaque"** da home mostra automaticamente os **3 projetos com `featured: true` mais recentes**
  (por `date`) — não precisa mexer na home pra isso, é só marcar `featured: true` no projeto e a data certa.
- `links` aceita mais de um item (ex.: "Visitar" + "Repositório"); ícone `github` usa o estilo de cor específico do
  GitHub, os outros usam a cor do `variant`.

## Adicionando um novo post no blog

Os posts são arquivos **`.mdx`** em [`src/content/blog/{lang}/{slug}.mdx`](src/content/blog) — sem CMS, sem banco de
dados. Cada post vive nos dois idiomas como arquivos separados.

1. Crie `src/content/blog/pt/meu-post.mdx` e `src/content/blog/en/my-post.mdx` (o slug do arquivo vira a URL:
   `/pt/blog/meu-post`).
2. No topo de cada arquivo, exporte os metadados como um objeto JS (⚠️ **não** use frontmatter em YAML com `---` — veja
   o porquê em [AGENTS.md](AGENTS.md)):

   ```mdx
   export const metadata = {
     title: "Título do post",
     summary: "Resumo curto que aparece no card da listagem.",
     date: "2026-08-15",
     translations: { en: "my-post" }, // slug da versão no outro idioma
   };

   Conteúdo em Markdown normal a partir daqui — títulos com `##`, **negrito**, `código inline`, blocos de código,
   listas, links, tudo funciona.
   ```

3. `translations` é importante: sem ele, o botão de troca de idioma na página do post cai de volta pra listagem `/blog`
   em vez de ir direto pro post traduzido (posts em idiomas diferentes costumam ter slugs diferentes).

A home mostra sempre os **3 posts mais recentes** (por `date`); a listagem completa fica em `/blog`. Nenhum dos dois
precisa ser atualizado manualmente — ambos leem os arquivos em `src/content/blog/` automaticamente.

## Currículo

O currículo (`/[lang]/resume`) e o PDF baixável (`/[lang]/resume/pdf`) são gerados a partir do mesmo arquivo:
[`src/data/resume.json`](src/data/resume.json). Editar o currículo é editar esse JSON — a página e o PDF nunca ficam
dessincronizados.

## Adicionando um arquivo ao terminal / explorador de arquivos

O "sistema de arquivos" que o terminal e o Explorador de Arquivos navegam é lido de verdade em disco, a partir de
[`public/vfs/`](public/vfs) — não tem dado hardcoded em código. Ver a seção correspondente em [AGENTS.md](AGENTS.md) pra
convenção de `.txt`/`.link`/imagens.

## Verificação antes de abrir um PR

- `npx tsc --noEmit` e `npx eslint src` sem erros.
- Testar as rotas relevantes nos dois idiomas (`/pt/...` e `/en/...`).
- Pra mudanças visuais, tirar um screenshot antes de considerar pronto.
