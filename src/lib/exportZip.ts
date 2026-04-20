import JSZip from "jszip";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { DashboardLanguage } from "@/i18n/dashboardTranslations";

// Local type matching DashboardClient's Session interface
interface Session {
  id: string;
  session_name?: string;
  template_name?: string;
  status: string;
  created_at?: string;
  final_document?: string;
  final_assets?: Record<string, unknown>;
}

const EXPORT_LABELS: Record<DashboardLanguage, {
  finished: string;
  inProgress: string;
  finalDocument: string;
  notFinished: string;
  unknownDate: string;
}> = {
  pt: {
    finished: '✅ Concluído',
    inProgress: '🔄 Em andamento',
    finalDocument: 'Documento Final',
    notFinished: 'Briefing não finalizado.',
    unknownDate: 'Data desconhecida',
  },
  en: {
    finished: '✅ Completed',
    inProgress: '🔄 In progress',
    finalDocument: 'Final Document',
    notFinished: 'Briefing not finished.',
    unknownDate: 'Unknown date',
  },
  es: {
    finished: '✅ Completado',
    inProgress: '🔄 En progreso',
    finalDocument: 'Documento Final',
    notFinished: 'Briefing no finalizado.',
    unknownDate: 'Fecha desconocida',
  },
};

function sessionToMarkdown(session: Session, lang: DashboardLanguage): string {
  const labels = EXPORT_LABELS[lang];
  const createdAt = session.created_at
    ? format(new Date(session.created_at), "dd/MM/yyyy HH:mm")
    : labels.unknownDate;

  const statusLabel =
    session.status === "finished"
      ? labels.finished
      : session.status === "in_progress"
      ? labels.inProgress
      : session.status;

  const lines: string[] = [
    `# ${session.template_name || "Briefing"}`,
    "",
    `**ID:** ${session.id}`,
    `**${lang === 'pt' ? 'Data' : lang === 'es' ? 'Fecha' : 'Date'}:** ${createdAt}`,
    `**Status:** ${statusLabel}`,
    "",
    "---",
    "",
  ];

  if (session.final_document) {
    lines.push(`## ${labels.finalDocument}`, "", session.final_document, "");
  } else {
    lines.push(`## ${labels.finalDocument}`, "", `_${labels.notFinished}_`, "");
  }

  return lines.join("\n");
}

export async function exportSessionsAsZip(sessions: Session[], lang: DashboardLanguage = 'en'): Promise<void> {
  const zip = new JSZip();

  const manifest: Record<string, unknown>[] = [];

  for (const session of sessions) {
    const rawName = session.template_name || session.id;
    const baseFolder = rawName.replace(/[^a-zA-Z0-9À-ÿ \-_]/g, "").trim().slice(0, 60) || session.id;
    // Suffix with the session id prefix so two sessions with identical names
    // don't overwrite each other inside the archive.
    const idSuffix = String(session.id).slice(0, 8);
    const folderName = `${baseFolder}_${idSuffix}`;
    const dateStr = session.created_at
      ? format(new Date(session.created_at), "yyyy-MM-dd")
      : "no-date";

    const fileName = `${dateStr}_briefing.md`;
    const md = sessionToMarkdown(session, lang);

    zip.folder(folderName)?.file(fileName, md);

    manifest.push({
      id: session.id,
      name: session.template_name || "Briefing",
      status: session.status,
      date: session.created_at,
      file: `${folderName}/${fileName}`,
    });
  }

  zip.file(
    "manifest.json",
    JSON.stringify({ exported_at: new Date().toISOString(), count: sessions.length, sessions: manifest }, null, 2)
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const exportDate = format(new Date(), "yyyy-MM-dd_HHmm");
  saveAs(blob, `brieffy_export_${exportDate}.zip`);
}
