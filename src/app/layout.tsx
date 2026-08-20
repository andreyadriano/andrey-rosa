// src/app/layout.tsx
//
// Root layout "de verdade" no sentido do App Router (único <html>/<body> da
// árvore). O lang="pt" aqui é só o fallback estático da rota "/" (o stub de
// redirect em page.tsx, que nunca chega a ser visto). Para as rotas reais
// de conteúdo (/pt/*, /en/*), o <html lang> é corrigido no cliente por
// LangSync em src/app/[lang]/layout.tsx — ver comentário lá para o porquê.

import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { defaultLocale } from "@/i18n/config";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={defaultLocale}
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      // O script anti-flash abaixo seta data-theme="light" no <html> antes
      // do primeiro paint, direto no DOM — fora do que o React renderizou
      // no servidor (que não sabe a preferência salva, sempre parte do
      // dark). Sem suppressHydrationWarning aqui, o React trata esse
      // atributo "extra" como um mismatch de hydration, descarta a árvore
      // inteira e a regenera do zero — e nesse processo o <script> não
      // reexecuta (scripts inseridos via DOM/React não rodam sozinhos) e o
      // atributo que ele tinha setado se perde, revertendo pro tema escuro
      // silenciosamente em todo reload com o claro salvo. Isso já
      // acontecia antes da aurora; só ficou óbvio agora porque o fundo
      // errado passou a ser um shader verde vivo em vez de só uma cor.
      suppressHydrationWarning
    >
      <head>
        <script
          // Aplica o tema salvo antes do primeiro paint, evitando flash do
          // tema errado (dark é o padrão fixo em globals.css).
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg pb-14">
        {children}
      </body>
    </html>
  );
}
