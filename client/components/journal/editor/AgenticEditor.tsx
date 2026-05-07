"use client";

import { useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { motion } from "framer-motion";
import { useAgenticEditor, type AgenticEditorAPI } from "./useAgenticEditor";
import type { JournalingMode } from "@shared/types/domain/wellbeing";

interface AgenticEditorProps {
  mode: JournalingMode;
  initialContent?: string;
  onUpdate?: (html: string, text: string, json: Record<string, unknown>) => void;
  onReady?: (api: AgenticEditorAPI) => void;
  className?: string;
}

export function AgenticEditor({
  mode,
  initialContent,
  onUpdate,
  onReady,
  className,
}: AgenticEditorProps) {
  const api = useAgenticEditor({ mode, initialContent, onUpdate });

  useEffect(() => {
    if (api.editor && onReady) {
      onReady(api);
    }
  }, [api.editor]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!api.editor) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-purple-500/50 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className={className}
    >
      <EditorContent
        editor={api.editor}
        className="flex-1 w-full observatory-font-body"
        style={{ fontSize: 16, lineHeight: 1.9, letterSpacing: "0.01em" }}
      />

      <style jsx global>{`
        .is-editor-empty::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.15);
          pointer-events: none;
          position: absolute;
          height: 0;
          float: left;
          font-style: normal;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.15);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </motion.div>
  );
}
