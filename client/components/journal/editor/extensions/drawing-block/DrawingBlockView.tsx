"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Pencil, Download, Trash2 } from "lucide-react";
import { DrawingCanvasModal } from "../../canvas/DrawingCanvasModal";

export function DrawingBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { previewUrl, fabricJson } = node.attrs;
  const [showCanvas, setShowCanvas] = useState(!previewUrl);

  return (
    <NodeViewWrapper className="my-3">
      {previewUrl ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <img src={previewUrl} alt="Drawing" className="w-full rounded-t-xl" />
          <div className="flex items-center justify-end gap-1 px-3 py-2 border-t border-white/5">
            <button
              onClick={() => setShowCanvas(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/30 hover:text-purple-300 hover:bg-purple-500/10 transition-colors text-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <a
              href={previewUrl}
              download="drawing.png"
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button onClick={deleteNode} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setShowCanvas(true)}
          className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center cursor-pointer hover:border-purple-500/30 transition-colors"
        >
          <Pencil className="w-8 h-8 text-white/15 mx-auto mb-2" />
          <p className="text-white/30 text-sm">Click to open drawing canvas</p>
        </div>
      )}

      <DrawingCanvasModal
        isOpen={showCanvas}
        onClose={() => setShowCanvas(false)}
        onSave={(pngDataUrl, json) => {
          updateAttributes({ previewUrl: pngDataUrl, fabricJson: json });
          setShowCanvas(false);
        }}
        initialFabricJson={fabricJson}
      />
    </NodeViewWrapper>
  );
}
