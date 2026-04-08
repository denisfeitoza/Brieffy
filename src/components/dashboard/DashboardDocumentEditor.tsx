"use client";

import { DocumentEditor } from "@/components/document/DocumentEditor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DashboardDocumentEditorProps {
  sessionId: string;
  documentContent: string;
  finalAssets: Record<string, unknown>;
}

export function DashboardDocumentEditor({
  sessionId,
  documentContent,
  finalAssets,
}: DashboardDocumentEditorProps) {
  const router = useRouter();

  const handleSave = async (newContent: string) => {
    // Update both document_content AND final_assets.document to keep them in sync
    const updatedAssets = {
      ...finalAssets,
      document: newContent,
    };

    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentContent: newContent,
        finalAssets: updatedAssets,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao salvar o documento.");
    }

    // Refresh the server component to show updated data
    router.refresh();
  };

  return (
    <DocumentEditor
      initialContent={documentContent}
      onSave={handleSave}
    />
  );
}
