<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project guide for AI agents

Site pessoal/portfólio (Next.js App Router, `src/` dir). Este arquivo documenta como o projeto funciona e as decisões de arquitetura — leia antes de mexer em conteúdo, i18n, tema ou no pipeline de blog/currículo.

## Estrutura de rotas

Tudo fica sob `src/app/[lang]/` — `lang` é `"pt" | "en"` (ver `src/i18n/config.ts`). `src/app/page.tsx` (fora de `[lang]`) só faz `redirect("/pt")`. Não existe detecção de idioma via `Accept-Language`: o site **não roda com `output: 'export'`** apesar do que comentários antigos no código sugerem — é um app Next.js normal (SSR/Route Handlers habilitados), necessário porque o PDF do currículo é gerado sob demanda numa Route Handler (`src/app/[lang]/resume/pdf/route.ts`).

Rotas atuais: `/[lang]`, `/[lang]/projects`, `/[lang]/blog`, `/[lang]/blog/[slug]`, `/[lang]/resume`, `/[lang]/resume/pdf`.

## Design tokens — nunca hardcode cor

Todas as cores vêm de variáveis CSS em `src/app/globals.css` (`--bg`, `--fg`, `--accent`, `--accent-2`, `--border`, etc.), expostas como utilitários Tailwind (`bg-bg`, `text-fg`, `border-border`, `text-accent`...). **Nunca** use hex/rgb direto ou classes de paleta padrão do Tailwind (`amber-400`, `white/10`) em componentes — sempre os tokens semânticos. Exceções pontuais e intencionais: cores de marca de terceiros (ex.: azul do LinkedIn `#0a66c2` no botão social) e o PDF do currículo, que usa sua própria paleta em `src/components/pdf/ResumeDocument.tsx` (react-pdf não lê CSS).

Tema dark é o padrão fixo, independente do SO (`prefers-color-scheme` não é usado de propósito). `:root[data-theme="light"]` define o par claro. Troca de tema: `src/components/ThemeToggle.tsx` grava em `localStorage`; um script inline em `src/app/layout.tsx` aplica o tema salvo antes do primeiro paint (evita flash).

Fontes: IBM Plex Mono (`--font-mono`, usada em quase toda a UI — títulos, labels, botões) e IBM Plex Sans (`--font-sans`, corpo de texto), carregadas via `next/font/google` em `src/app/layout.tsx`.

## i18n

`src/i18n/locales/{pt,en}.json` — dicionários planos, tipados a partir do `pt.json` (source of truth) em `src/i18n/config.ts`. `getDictionary(lang)` faz dynamic import do JSON certo. Toda string de UI vem do dicionário — nunca texto fixo em um idioma só.

`LangSwitcher` (`src/components/LangSwitcher.tsx`) troca `/pt/...` ↔ `/en/...` trocando o segmento no `pathname` atual — funciona quando a URL é idêntica nos dois idiomas. Quando **não é** (ex.: slug de post traduzido é diferente), a página deve registrar o caminho certo via `LangAlternateContext`/`SetLangAlternate` (ver `src/app/[lang]/blog/[slug]/page.tsx` pro padrão) — sem isso, trocar de idioma num post gera 404.

## Conteúdo: projetos

`src/data/projects.ts` — `Record<Lang, Project[]>` estático (mock data, não vem de arquivo/CMS). Cada `Project` tem `date` e `featured: boolean`. `getFeaturedProjects(lang, limit)` filtra `featured`, ordena por `date` desc e corta — é isso que a home usa pra "Projetos em destaque". `/projects` lista o array inteiro sem filtro. Ver README.md pra instruções de uso; a regra de arquitetura é: **nunca hardcode a seleção de "quais projetos aparecem na home"** — sempre via `getFeaturedProjects`.

## Conteúdo: blog

Pipeline real de Markdown/MDX, **sem CMS nem banco de dados** — cada post é `src/content/blog/{lang}/{slug}.mdx`, versionado no git. `src/lib/blog.ts` expõe `getAllPosts`, `getPostSlugs`, `getReadingTime` (lê os arquivos com `fs`, calcula tempo de leitura por contagem de palavras).

**Decisão importante**: os metadados do post (`title`, `summary`, `date`, `translations`) são exportados como objeto JS dentro do próprio `.mdx` (`export const metadata = {...}`) — **não** frontmatter YAML com `---`. Motivo: o compilador MDX em Rust (`mdxRs: true`, ver `next.config.ts`) é o único caminho compatível com Turbopack (usado por `next dev` por padrão); ele não aceita plugins remark/rehype (`remark-frontmatter` incluso), porque Turbopack exige que opções de loader sejam serializáveis e um plugin é uma função JS. Isso já foi tentado e falhou — não reintroduza `gray-matter`/`remark-frontmatter` sem antes resolver esse conflito (ou trocar Turbopack por webpack no `next dev`, o que tem seu próprio custo).

A página de post (`/[lang]/blog/[slug]`) faz `import(`@/content/blog/${lang}/${slug}.mdx`)` dinamicamente — um único import dá o componente compilado (`default`) e o `metadata`. `src/mdx-components.tsx` mapeia as tags HTML do Markdown (h2, p, code, pre, a, blockquote...) pros tokens de cor/tipografia do site; é uma **convenção de nome e local exigida pelo Next.js** (tem que ficar em `src/mdx-components.tsx` — não mova pra `lib/` ou outro lugar, o `@next/mdx` para de encontrar).

## Currículo / PDF

`src/data/resume.json` é a fonte única. A página `/[lang]/resume` renderiza esse JSON na tela; a Route Handler `/[lang]/resume/pdf` (`runtime = "nodejs"`, precisa de Node — não roda em Edge) gera o PDF sob demanda com `@react-pdf/renderer`, usando `src/components/pdf/ResumeDocument.tsx`. Layout do PDF é pensado pra ser **ATS-friendly**: coluna única, sem tabelas, sem texto dentro de imagem, skills/idiomas como texto corrido (não "chips" em `View`s separadas), `wrap={false}` em cada seção/entrada pra nunca deixar um título de seção órfão numa quebra de página.

## Componentes reutilizáveis

- `SectionLabel` — label de seção (ex.: "SOBRE MIM") usado em várias páginas.
- `ProjectCard` / `PostCard` — cards usados tanto na home quanto nas páginas de listagem (`/projects`, `/blog`); qualquer ajuste visual deve ir nesses componentes, não duplicado em página.
- `icons.tsx` — `GithubIcon`/`LinkedinIcon` (SVG inline; lucide-react removeu ícones de marca) e `GITHUB_LINK_CLASSNAME` (estilo de hover compartilhado entre o social do hero e o botão "Repositório" dos cards).
- `TopBar` — nav + `LangSwitcher` + `ThemeToggle`, renderizada uma vez em `src/app/[lang]/layout.tsx`, compartilhada por todas as rotas.

## Terminal e Explorador de Arquivos ("janelas" flutuantes)

Há dois "programas" flutuantes montados uma vez em `src/app/[lang]/layout.tsx`, presentes em todas as rotas: um Terminal e um Explorador de Arquivos. A arquitetura é dividida em duas camadas pra permitir isso — e futuros programas — sem duplicar a mecânica de janela:

- `src/components/window/` — sistema de janelas **genérico**, sem saber nada sobre terminal/explorador: `useWindow({id, title, icon, defaultSize, minSize?, defaultMode?})` (mode/posição/tamanho, arrastar, redimensionar por qualquer borda, minimizar/maximizar/fechar, persistência entre remounts de troca de idioma — `Map` module-level por `id`), `WindowFrame` (chrome: titlebar com os 3 botões coloridos + alças de redimensionar), `WindowManagerContext`/`Taskbar` (registro de programas abertos pra barra de tarefas mostrar um botão por programa). Qualquer novo "programa" chama `useWindow(...)` e renderiza `<WindowFrame>` — essa é a "interface" que todo programa implementa. `defaultMode` (default `"open"`) só vale na primeira montagem de verdade — o Explorador usa `"minimized"` pra não abrir sobreposto ao Terminal.
- `src/components/apps/Terminal/` — `useShell` (boot, digitação, log, histórico, autocomplete, comandos) + `index.tsx` (composição).
- `src/components/apps/FileExplorer/` — `useExplorer` (cwd + abrir um nó: pasta desce, imagem/texto mostra preview inline, link navega/abre aba) + `FileIcon` (ícone por tipo de nó) + `index.tsx` (composição: breadcrumb, botão "subir", grid de ícones ou preview).

Os dois navegam o **mesmo sistema de arquivos simulado** (`src/lib/vfs/`), construído a partir de arquivos de verdade em disco, não de dados hardcoded — `buildFileSystem(lang)` é chamado uma vez em `layout.tsx` e passado como prop `fs` pra ambos os apps.
Tudo mora dentro de `public/vfs/` — precisa ser público mesmo pra imagem virar `<img src>` de verdade (arquivo em `src/` não é servido por URL, só compilado). Não tem split entre pasta de conteúdo e pasta pública: é uma pasta só.
- `public/vfs/{lang}/` — arquivos de texto (`.txt`) e "atalhos" (`.link`, cujo conteúdo é uma URL/rota), um por idioma. A estrutura de pastas aqui **é** a árvore que `ls`/`cd`/o Explorador percorrem — adicionar um arquivo novo (texto, link ou imagem) é só soltar ele na pasta certa, sem mexer em código (mesmo espírito do pipeline de blog).
- `public/vfs/assets/` — imagens compartilhadas entre os dois idiomas, mescladas na raiz da árvore por `buildFileSystem()`. Imagem específica de um idioma pode ir direto dentro de `public/vfs/{lang}/` também — `readTree()` reconhece os três tipos (texto/link/imagem) em qualquer pasta.
- No Terminal, `cd`/`ls` navegam só dentro dessa simulação (não saem da página); o comando `open <arquivo>` é quem decide navegar pra uma rota real (`.link` interno) ou abrir em nova aba (`.link` externo/imagem). No Explorador, clicar numa pasta desce, num arquivo de texto/imagem mostra preview inline na própria janela, num link aplica a mesma regra interno/externo do `open`.

## Verificação antes de considerar uma tarefa pronta

- `npx tsc --noEmit` e `npx eslint src` (ou `npx eslint <arquivos>`) sem erros.
- Testar rotas relevantes com `curl -o /dev/null -w "%{http_code}"` pros dois idiomas.
- Pra mudanças visuais, capturar screenshot com `google-chrome --headless --disable-gpu --no-sandbox --screenshot=...` (o projeto não tem Playwright/Puppeteer instalado) em vez de assumir que ficou certo.
- Reiniciar o `next dev` depois de mudar `next.config.ts` — mudanças de config não são hot-reloaded.

## Mantenha isto atualizado

Se uma decisão de arquitetura mudar (ex.: trocar o pipeline de MDX, mudar o gerador de PDF, adicionar um novo idioma), atualize esta seção no mesmo PR/commit — este arquivo existe pra evitar que o próximo agente redescubra as mesmas armadilhas.

