"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRef, useCallback } from "react";
import { Download, Trash2, Paperclip } from "lucide-react";
import { formatSize, validateFile } from "../../media/media-validators";
import { api } from "@/lib/api-client";

const FILE_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "text/plain": "📝",
  "text/csv": "📊",
  "application/json": "{ }",
};

export function FileBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { url, filename, mimeType, sizeBytes, uploadedAt } = node.attrs;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) return;

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post<{ publicUrl?: string; url: string }>(
        "/upload/document",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (response.success && response.data) {
        updateAttributes({
          url: response.data.publicUrl || response.data.url,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }
    } catch { /* handled by error state */ }
  }, [updateAttributes]);

  if (!url) {
    return (
      <NodeViewWrapper className="my-3">
        <div
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center cursor-pointer hover:border-white/20 transition-colors"
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.csv,.json" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
          <Paperclip className="w-6 h-6 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">Click to attach a file</p>
          <p className="text-white/20 text-xs mt-1">PDF, DOCX, TXT, CSV, JSON — max 25MB</p>
        </div>
      </NodeViewWrapper>
    );
  }

  const icon = FILE_ICONS[mimeType] || "📎";
  const ext = filename.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <NodeViewWrapper className="my-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white/70 text-sm font-medium truncate">{filename}</div>
          <div className="text-white/25 text-xs">
            {ext} • {formatSize(sizeBytes)}
            {uploadedAt && ` • ${new Date(uploadedAt).toLocaleDateString()}`}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button onClick={deleteNode} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
