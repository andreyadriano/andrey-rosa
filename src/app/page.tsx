// src/app/page.tsx
//
// Rota raiz "/" — fora da pasta [lang]. Como o site é 100% estático
// (output: 'export'), não há middleware/proxy pra detectar idioma via
// Accept-Language; o padrão é sempre redirecionar pra /pt. Quem quiser
// inglês troca pelo seletor de idioma no Navbar (que leva pra /en).
//
// redirect() aqui roda em build time — o Next.js gera um HTML estático
// com meta-refresh/redirect embutido, sem precisar de servidor.

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/pt");
}
