# andreyadriano.dev

Site pessoal e portfólio de **Andrey Adriano da Rosa** — Engenheiro de Telecomunicações e desenvolvedor de software focado em VoIP e Linux embarcado. Construído com Next.js (App Router), bilíngue (PT/EN), sem CMS e sem banco de dados: todo o conteúdo — projetos, posts do blog, currículo — vive versionado no próprio repositório.

## O que tem de interessante aqui

### Currículo que gera o próprio PDF

O currículo (`/resume`) e o PDF baixável (`/resume/pdf`) nascem do mesmo arquivo JSON. Não existem dois lugares pra manter sincronizados — o PDF é montado sob demanda com `@react-pdf/renderer`, em um layout pensado pra passar por leitores de ATS: coluna única, sem tabelas, sem texto dentro de imagem.

### Blog em Markdown de verdade, sem CMS

Cada post é um arquivo `.mdx` versionado no git, com os metadados exportados como objeto JS no topo do próprio arquivo (não frontmatter YAML — o compilador MDX em Rust usado pelo Turbopack não aceita plugins remark/rehype). Sem banco de dados, sem painel administrativo: escrever um post é criar um arquivo.

### Um terminal de verdade flutuando na tela

O primeiro elemento que aparece na home não é um hero estático — é um **terminal simulado** que faz boot na sua frente, digita `whoami` sozinho e mostra minhas informações como se fosse a saída de um comando real. Depois disso, ele continua ali, aberto, esperando você digitar algo:

```
visitante@andrey:~$ whoami
nome     Andrey Adriano da Rosa
cargo    Desenvolvedor de software | Linux Embarcado & VoIP
stack    Go · React · C · Lua · Asterisk
status   ● Disponível para novas oportunidades

visitante@andrey:~$ ls
about.txt  blog/  contact/  projects/  resume/  skills.txt

visitante@andrey:~$ cd projects && open readme.link
```

Ele suporta `ls`, `cd`, `cat`, `open`, histórico com as setas, autocomplete com Tab, `clear`, `reboot` — e se comporta como um shell de verdade nos detalhes: erros de "command not found", `Ctrl+L`, sensibilidade a maiúsculas/minúsculas.

### ...que navega um sistema de arquivos simulado de verdade

O terminal não inventa uma resposta pra `ls` — ele lê uma árvore de diretórios real, montada em tempo de build a partir de arquivos de verdade em `public/vfs/{pt,en}/`. Cada `.txt` é um arquivo de texto, cada `.link` é um atalho (interno ou externo), e imagens funcionam nativamente. Adicionar um arquivo novo ao "sistema operacional" do site é literalmente soltar um arquivo numa pasta — nenhuma linha de código muda.

### E um Explorador de Arquivos pra quem prefere clicar

O mesmo VFS também é navegável visualmente: uma segunda janela, com grid de ícones, breadcrumb e preview inline de texto/imagem — construída em cima da mesma base do terminal, sem duplicar nenhuma lógica de navegação.

### Um sistema de janelas genérico, não só "um terminal com CSS"

Terminal e Explorador de Arquivos são as primeiras duas instâncias de uma abstração reaproveitável: `useWindow()` + `<WindowFrame>` dão arrastar, redimensionar por qualquer borda, minimizar, maximizar, empilhamento (a última janela mexida sempre fica por cima) e uma taskbar que sabe automaticamente quais "programas" existem — tudo isso sem que a taskbar ou o gerenciador de janelas saibam o que é um terminal. Qualquer programa novo só precisa chamar o hook e desenhar seu próprio conteúdo dentro do frame. Clicar fora de qualquer janela minimiza todas de uma vez, pra quem só quer ler a página em paz.

### Zero cor hardcoded

Todo o tema (inclusive os botões coloridos das janelas) vem de tokens CSS semânticos — trocar o tema claro/escuro, ou dar um novo significado a uma cor, nunca exige caçar hex codes espalhados pelos componentes.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4** — tokens de tema em [`src/app/globals.css`](src/app/globals.css)
- **IBM Plex Mono / IBM Plex Sans** via `next/font/google`
- **MDX** (`@next/mdx`) para os posts do blog
- **`@react-pdf/renderer`** para o PDF do currículo, gerado sob demanda
- Sistema de janelas e VFS simulado feitos do zero — sem libs de terceiros

---

Quer rodar o projeto localmente, adicionar um novo projeto ao portfólio ou escrever um post no blog? Veja **[DEVELOPMENT.md](DEVELOPMENT.md)**.
