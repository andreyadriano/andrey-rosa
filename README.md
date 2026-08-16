# NextJS Portfolio

Site pessoal / portfólio. Next.js (App Router) com suporte a português e inglês, currículo gerado dinamicamente em PDF e blog em Markdown/MDX — sem CMS, sem banco de dados.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — o `/` redireciona para `/pt`.

## Adicionando um novo projeto

Os projetos vivem em [`src/data/projects.ts`](src/data/projects.ts), um objeto `Record<Lang, Project[]>` com uma entrada em `pt` e outra em `en`. Para adicionar um projeto, adicione um item em **ambos** os arrays:

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
- A seção **"Projetos em destaque"** da home mostra automaticamente os **3 projetos com `featured: true` mais recentes** (por `date`) — não precisa mexer na home pra isso, é só marcar `featured: true` no projeto e a data certa.
- `links` aceita mais de um item (ex.: "Visitar" + "Repositório"); ícone `github` usa o estilo de cor específico do GitHub, os outros usam a cor do `variant`.

## Adicionando um novo post no blog

Os posts são arquivos **`.mdx`** em [`src/content/blog/{lang}/{slug}.mdx`](src/content/blog) — sem CMS, sem banco de dados. Cada post vive nos dois idiomas como arquivos separados.

1. Crie `src/content/blog/pt/meu-post.mdx` e `src/content/blog/en/my-post.mdx` (o slug do arquivo vira a URL: `/pt/blog/meu-post`).
2. No topo de cada arquivo, exporte os metadados como um objeto JS (⚠️ **não** use frontmatter em YAML com `---` — veja o porquê no README para agentes):

   ```mdx
   export const metadata = {
     title: "Título do post",
     summary: "Resumo curto que aparece no card da listagem.",
     date: "2026-08-15",
     translations: { en: "my-post" }, // slug da versão no outro idioma
   };

   Conteúdo em Markdown normal a partir daqui — títulos com `##`, **negrito**,
   `código inline`, blocos de código, listas, links, tudo funciona.
   ```

3. `translations` é importante: sem ele, o botão de troca de idioma na página do post cai de volta pra listagem `/blog` em vez de ir direto pro post traduzido (posts em idiomas diferentes costumam ter slugs diferentes).

A home mostra sempre os **3 posts mais recentes** (por `date`); a listagem completa fica em `/blog`. Nenhum dos dois precisa ser atualizado manualmente — ambos leem os arquivos em `src/content/blog/` automaticamente.

## Currículo

O currículo (`/[lang]/resume`) e o PDF baixável (`/[lang]/resume/pdf`) são gerados a partir do mesmo arquivo: [`src/data/resume.json`](src/data/resume.json). Editar o currículo é editar esse JSON — a página e o PDF nunca ficam dessincronizados.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4** — cores/temas via tokens CSS em [`src/app/globals.css`](src/app/globals.css)
- **IBM Plex Mono / IBM Plex Sans** via `next/font/google`
- **MDX** (`@next/mdx`) para os posts do blog
- **`@react-pdf/renderer`** para gerar o PDF do currículo sob demanda

Para detalhes de arquitetura e convenções do projeto, veja [`AGENTS.md`](AGENTS.md).
