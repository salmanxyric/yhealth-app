"use client";

import { useEffect, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { motion } from "framer-motion";
import { useAgenticEditor, type AgenticEditorAPI } from "./useAgenticEditor";
import { BubbleToolbar } from "./toolbar/BubbleToolbar";
import { ImageUploadDialog } from "./media/ImageUploadDialog";
import { useDictation } from "./useDictation";
import { DictationOverlay } from "./dictation/DictationOverlay";
import { useAICoach } from "./ai/useAICoach";
import { AIPill } from "./ai/AIPill";
import { CoachingNudge } from "./ai/CoachingNudge";
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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [dictationActive, setDictationActive] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const aiCoach = useAICoach();

  const dictation = useDictation({
    onTranscript: (text, isFinal) => {
      if (isFinal && api.editor) {
        api.editor.chain().focus().insertContent(text + " ").run();
      }
    },
    onEnd: () => setDictationActive(false),
  });

  useEffect(() => {
    if (api.editor && onReady) {
      onReady(api);
    }
  }, [api.editor]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => setShowImageDialog(true);
    document.addEventListener("slash-menu:image", handler);
    return () => document.removeEventListener("slash-menu:image", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setDictationActive(true);
      dictation.start();
    };
    document.addEventListener("slash-menu:dictation", handler);
    return () => document.removeEventListener("slash-menu:dictation", handler);
  }, [dictation.start]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI slash command listeners
  useEffect(() => {
    if (!api.editor) return;
    const editor = api.editor;
    const handlers: Record<string, () => void> = {
      "slash-menu:ai-continue": () => {
        const text = api.getText();
        if (text.length > 0) {
          aiCoach.sendMessage(`Continue this thought: ${text.slice(-200)}`);
        }
      },
      "slash-menu:ai-rewrite": () => {
        const { from, to } = editor.state.selection;
        const selected = editor.state.doc.textBetween(from, to);
        if (selected) aiCoach.sendMessage(`Rewrite this: ${selected}`);
      },
      "slash-menu:ai-expand": () => {
        const text = api.getText();
        aiCoach.sendMessage(`Expand on this idea: ${text.slice(-200)}`);
      },
      "slash-menu:ai-reframe": () => {
        const text = api.getText();
        aiCoach.sendMessage(`Apply a CBT cognitive reframe to: ${text.slice(-300)}`);
      },
      "slash-menu:ai-prompt": () => {
        aiCoach.sendMessage("Give me a follow-up journaling prompt based on what I've written so far.");
      },
    };
    const entries = Object.entries(handlers);
    entries.forEach(([event, handler]) => document.addEventListener(event, handler));
    return () => entries.forEach(([event, handler]) => document.removeEventListener(event, handler));
  }, [api.editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analyze content periodically (debounced)
  useEffect(() => {
    if (!api.editor) return;
    const timer = setTimeout(() => {
      aiCoach.analyzeContent(api.getText(), mode);
    }, 5000);
    return () => clearTimeout(timer);
  }, [api.editor?.state.doc.content.size]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {api.editor && <BubbleToolbar editor={api.editor} />}

      <ImageUploadDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={(url, alt) => {
          api.editor?.chain().focus().setImage({ src: url, alt: alt || "" }).run();
        }}
      />

      <DictationOverlay
        isActive={dictationActive}
        status={dictation.status}
        elapsed={dictation.elapsed}
        onPause={dictation.pause}
        onResume={dictation.resume}
        onStop={() => {
          dictation.stop();
          setDictationActive(false);
        }}
      />

      <AIPill
        insights={aiCoach.insights}
        isLoading={aiCoach.isLoading}
        onSendMessage={aiCoach.sendMessage}
        onDismissInsight={aiCoach.dismissInsight}
        onQuickAction={(action) => {
          // TODO: Wire quick actions to AI slash commands
        }}
      />

      <CoachingNudge message={nudgeMessage} onDismiss={() => setNudgeMessage(null)} />

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
