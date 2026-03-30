import JSZip from "jszip";
import { saveAs } from "file-saver";

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
import { format } from "date-fns";

function sessionToMarkdown(session: Session): string {
  const createdAt = session.created_at
    ? format(new Date(session.created_at), "dd/MM/yyyy HH:mm")
    : "Data desconhecida";

  const statusLabel =
    session.status === "finished"
      ? "✅ Concluído"
      : session.status === "in_progress"
      ? "🔄 Em andamento"
      : session.status;

  const lines: string[] = [
    `# ${session.template_name || "Briefing"}`,
    "",
    `**ID:** ${session.id}`,
    `**Data:** ${createdAt}`,
    `**Status:** ${statusLabel}`,
    "",
    "---",
    "",
  ];

  if (session.final_document) {
    lines.push("## Documento Final", "", session.final_document, "");
  } else {
    lines.push("## Documento Final", "", "_Briefing não finalizado._", "");
  }

  return lines.join("\n");
}

export async function exportSessionsAsZip(sessions: Session[]): Promise<void> {
  const zip = new JSZip();

  const manifest: Record<string, unknown>[] = [];

  for (const session of sessions) {
    // Sanitize folder name
    const rawName = session.template_name || session.id;
    const folderName = rawName.replace(/[^a-zA-Z0-9À-ÿ \-_]/g, "").trim().slice(0, 60) || session.id;
    const dateStr = session.created_at
      ? format(new Date(session.created_at), "yyyy-MM-dd")
      : "sem-data";

    const fileName = `${dateStr}_briefing.md`;
    const md = sessionToMarkdown(session);

    zip.folder(folderName)?.file(fileName, md);

    manifest.push({
      id: session.id,
      name: session.template_name || "Briefing",
      status: session.status,
      date: session.created_at,
      file: `${folderName}/${fileName}`,
    });
  }

  // Add manifest
  zip.file(
    "manifest.json",
    JSON.stringify({ exported_at: new Date().toISOString(), count: sessions.length, sessions: manifest }, null, 2)
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const exportDate = format(new Date(), "yyyy-MM-dd_HHmm");
  saveAs(blob, `brieffy_export_${exportDate}.zip`);
}
