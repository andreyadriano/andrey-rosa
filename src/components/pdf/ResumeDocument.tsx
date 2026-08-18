// src/components/pdf/ResumeDocument.tsx
//
// Documento PDF gerado a partir do mesmo @/data/resume.json usado na página
// /[lang]/resume — assim currículo exibido no site e PDF baixável nunca
// ficam dessincronizados; atualizar o currículo é só editar o JSON.
//
// Só é importado pela route handler (src/app/[lang]/resume/pdf/route.ts),
// nunca renderizado no browser — os componentes do @react-pdf/renderer
// (Document, Page, View...) não são elementos DOM, são primitivas de PDF.

import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Resume } from "@/types";

const ACCENT = "#3f8f52";
const INK = "#141815";
const MUTED = "#5b655d";
const BORDER = "#d8ddd9";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: INK,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 19,
  },
  role: {
    marginTop: 2,
    fontSize: 11,
    color: ACCENT,
  },
  contactRow: {
    marginTop: 3,
    flexDirection: "row",
    gap: 10,
  },
  contactItem: {
    fontSize: 8.5,
    color: MUTED,
  },
  contactLink: {
    fontSize: 8.5,
    color: ACCENT,
    textDecoration: "none",
  },
  summary: {
    marginTop: 10,
    lineHeight: 1.12,
    color: INK,
  },
  section: {
    marginTop: 7,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 3,
  },
  entry: {
    marginBottom: 5,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  entryPeriod: {
    fontSize: 8.5,
    color: MUTED,
  },
  entrySubtitle: {
    fontSize: 9,
    color: MUTED,
    marginTop: 1,
  },
  highlight: {
    flexDirection: "row",
    marginTop: 2,
    gap: 4,
  },
  highlightBullet: {
    lineHeight: 1.12,
  },
  highlightText: {
    flex: 1,
    lineHeight: 1.12,
  },
  plainList: {
    lineHeight: 1.2,
  },
});

export interface ResumeDocumentLabels {
  experience: string;
  education: string;
  skills: string;
  languages: string;
}

export function ResumeDocument({
  resume,
  labels,
}: {
  resume: Resume;
  labels: ResumeDocumentLabels;
}) {
  return (
    <Document title={`${resume.name} — ${resume.role}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.role}>{resume.role}</Text>
        <View style={styles.contactRow}>
          <Link style={styles.contactLink} src={`mailto:${resume.email}`}>
            {resume.email}
          </Link>
          <Link style={styles.contactLink} src={`https://${resume.linkedin}`}>
            {resume.linkedin}
          </Link>
          <Link style={styles.contactLink} src={`https://${resume.github}`}>
            {resume.github}
          </Link>
        </View>

        <Text style={styles.summary}>{resume.summary}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.experience}</Text>
          {resume.experience.map((item) => (
            <View
              key={`${item.company}-${item.position}`}
              style={styles.entry}
              wrap={false}
            >
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryTitle}>{item.position}</Text>
                <Text style={styles.entryPeriod}>{item.period}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{item.company}</Text>
              {item.highlights.map((highlight) => (
                <View key={highlight} style={styles.highlight}>
                  <Text style={styles.highlightBullet}>•</Text>
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{labels.education}</Text>
          {resume.education.map((item) => (
            <View
              key={`${item.institution}-${item.degree}`}
              style={styles.entry}
            >
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryTitle}>{item.degree}</Text>
                <Text style={styles.entryPeriod}>{item.period}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{item.institution}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{labels.skills}</Text>
          {Object.entries(resume.skills).map(([category, skills]) => (
            <Text key={category} style={styles.plainList}>
              {category}: {skills.join(", ")}
            </Text>
          ))}
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{labels.languages}</Text>
          <Text style={styles.plainList}>{resume.languages.join(", ")}</Text>
        </View>
      </Page>
    </Document>
  );
}
