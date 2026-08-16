import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// mdxRs: true usa o compilador MDX em Rust embutido no SWC do Next.js —
// nativo do Turbopack (usado por `next dev` por padrão). Frontmatter em
// YAML (gray-matter/remark-frontmatter) exigiria o pipeline em JS
// (@mdx-js/loader), que não roda sob Turbopack: as opções de loader
// precisam ser serializáveis, e plugins remark são funções. Por isso os
// posts usam `export const metadata = {...}` dentro do próprio .mdx — o
// padrão que a própria documentação do Next.js recomenda para o App
// Router.
const withMDX = createMDX({});

const nextConfig: NextConfig = {
  experimental: {
    mdxRs: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
};

export default withMDX(nextConfig);
