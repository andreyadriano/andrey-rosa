// src/app/[lang]/resume/pdf/route.ts
//
// Gera o PDF do currículo sob demanda a partir do mesmo @/data/resume.json
// renderizado em /[lang]/resume — nunca fica dessincronizado de um arquivo
// estático em public/. @react-pdf/renderer precisa do runtime Node (não
// roda em Edge).

import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { ResumeDocument } from "@/components/pdf/ResumeDocument";
import { getDictionary, isValidLocale, locales } from "@/i18n/config";
import resumeData from "@/data/resume.json";
import type { Lang, ResumeData } from "@/types";

export const runtime = "nodejs";

const resume = resumeData as ResumeData;

export async function generateStaticParams() {
  return locales.map((lang: Lang) => ({ lang }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  if (!isValidLocale(lang)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dict = await getDictionary(lang as Lang);
  const buffer = await renderToBuffer(
    ResumeDocument({
      resume: resume[lang as Lang],
      labels: dict.resumePage.sections,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cv-andrey-${lang}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
