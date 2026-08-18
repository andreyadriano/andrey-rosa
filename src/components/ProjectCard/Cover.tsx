// src/components/ProjectCard/Cover.tsx
//
// Capa do card de projeto. Com screenshot real (project.image), só
// renderiza a imagem. Sem imagem, gera uma capa a partir dos ícones das
// próprias tags (StackIcon) sobre um fundo em grade — mantém o card visual
// mesmo pra projetos sem demo pública, sem exigir arte feita à mão por
// projeto e sem depender de nenhuma cor fora dos tokens do tema.
//
// coverVariant permite trocar esse fallback genérico por uma ilustração
// específica quando o ícone das tags sozinho não representa bem o projeto
// (ver "chess-ai" abaixo) — mapeado em COVER_VARIANTS, tudo com os tokens
// do tema, sem imagem externa (evita questão de licença de foto de banco).

import Image from "next/image";
import { StackIcon } from "./StackIcon";
import type { Lang } from "@/types";

const COVER_HEIGHT = "h-36";

function GridBackdrop() {
  return (
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    />
  );
}

// Posição inicial padrão do xadrez, linha 0 = fileira 8 (pretas) até linha 7
// = fileira 1 (brancas). Glifos Unicode de xadrez já distinguem a cor pelo
// próprio desenho (contorno vs. preenchido) — não depende de nenhuma imagem.
const INITIAL_POSITION = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

// Casa alvo da "bounding box" de detecção: peão branco em e2, o lance de
// abertura mais clássico do xadrez.
const DETECTION_TARGET = { row: 6, col: 4 };

// Rótulo de confiança sobre a casa alvo, estilo predição de um modelo de
// detecção (YOLO) — texto e idioma são detalhe desta ilustração específica,
// não pertencem ao Project nem ao dicionário i18n geral do site.
const DETECTION_LABEL: Record<Lang, string> = {
  pt: "peão 0.97",
  en: "pawn 0.97",
};

// Tabuleiro de xadrez na posição inicial, com uma marcação estilo
// "bounding box" de detecção de objetos sobre uma peça — representa
// literalmente o projeto (reconhecer lances de xadrez a partir de imagens
// via YOLO), em vez de uma foto genérica de tabuleiro.
function ChessAiCover({ lang }: { lang: Lang }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative grid grid-cols-8 grid-rows-8 w-32 h-32 border border-border-strong">
        {INITIAL_POSITION.flatMap((pieces, row) =>
          pieces.map((piece, col) => {
            const dark = (row + col) % 2 === 1;
            const isWhitePiece = row >= 6;
            return (
              <div
                key={`${row}-${col}`}
                className={`flex items-center justify-center text-[15px] leading-none ${dark ? "bg-fg/10" : ""} ${
                  isWhitePiece ? "text-fg" : "text-fg-muted"
                }`}
              >
                {piece}
              </div>
            );
          }),
        )}
        {/* Cantos de "bounding box" de detecção sobre a casa alvo */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${(DETECTION_TARGET.col / 8) * 100}%`,
            top: `${(DETECTION_TARGET.row / 8) * 100}%`,
            width: `${100 / 8}%`,
            height: `${100 / 8}%`,
          }}
        >
          <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 border-accent" />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2 border-accent" />
          <span className="absolute left-0 bottom-0 h-2.5 w-2.5 border-l-2 border-b-2 border-accent" />
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 border-r-2 border-b-2 border-accent" />
          <span className="absolute left-0 bottom-full mb-0.5 whitespace-nowrap rounded-sm bg-accent px-1 font-mono text-[7px] leading-[1.4] text-accent-fg">
            {DETECTION_LABEL[lang]}
          </span>
        </div>
      </div>
    </div>
  );
}

const COVER_VARIANTS: Record<string, (props: { lang: Lang }) => React.ReactElement> = {
  "chess-ai": ChessAiCover,
};

export function ProjectCover({
  image,
  title,
  tags,
  coverVariant,
  lang,
}: {
  image?: string;
  title: string;
  tags: string[];
  coverVariant?: string;
  lang: Lang;
}) {
  if (image) {
    return (
      <div className={`relative ${COVER_HEIGHT} w-full overflow-hidden rounded-md border border-border`}>
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover object-top"
        />
      </div>
    );
  }

  const Variant = coverVariant ? COVER_VARIANTS[coverVariant] : undefined;

  return (
    <div
      className={`relative ${COVER_HEIGHT} w-full overflow-hidden rounded-md border border-border bg-gradient-to-br from-accent/10 via-surface to-accent-2/10`}
      aria-hidden="true"
    >
      <GridBackdrop />
      {Variant ? (
        <Variant lang={lang} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-80">
          {tags.slice(0, 3).map((tag) => (
            <StackIcon key={tag} tag={tag} size={32} />
          ))}
        </div>
      )}
    </div>
  );
}
