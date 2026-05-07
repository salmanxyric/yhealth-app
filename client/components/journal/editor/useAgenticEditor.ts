"use client";

import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import { createLowlight } from "lowlight";
import { useCallback } from "react";
import type { JournalingMode } from "@shared/types/domain/wellbeing";
import { SlashMenuExtension } from "./slash-menu/slash-menu-extension";
import { AudioBlock } from "./extensions/audio-block/audio-block-extension";
import { VideoBlock } from "./extensions/video-block/video-block-extension";
import { FileBlock } from "./extensions/file-block/file-block-extension";
import { DrawingBlock } from "./extensions/drawing-block/drawing-block-extension";

const PLACEHOLDER_BY_MODE: Record<JournalingMode, string> = {
  quick_reflection: "Take a moment to reflect on your day so far. What stands out?",
  deep_dive: "Let your thoughts flow freely. Explore what is on your mind without judgement...",
  gratitude: "Name three things you are grateful for today. Why do they matter to you?",
  life_perspective: "Consider your values and the person you are becoming. What do you notice?",
  free_write: "Start writing. There are no rules here — just let the words come...",
  voice_conversation: "Speak your thoughts aloud. Your voice will be transcribed and guided by AI...",
};

interface UseAgenticEditorOptions {
  mode: JournalingMode;
  initialContent?: string;
  onUpdate?: (html: string, text: string, json: Record<string, unknown>) => void;
}

export interface AgenticEditorAPI {
  editor: Editor | null;
  wordCount: number;
  charCount: number;
  getHTML: () => string;
  getText: () => string;
  getJSON: () => Record<string, unknown>;
  isEmpty: () => boolean;
  focus: () => void;
}

export function useAgenticEditor({
  mode,
  initialContent,
  onUpdate,
}: UseAgenticEditorOptions): AgenticEditorAPI {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: PLACEHOLDER_BY_MODE[mode],
        emptyEditorClass: "is-editor-empty",
      }),
      CodeBlockLowlight.configure({
        lowlight: createLowlight(),
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-purple-400 underline hover:text-purple-300 transition-colors",
        },
      }),
      CharacterCount,
      SlashMenuExtension,
      AudioBlock,
      VideoBlock,
      FileBlock,
      DrawingBlock,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: [
          "prose prose-invert max-w-none focus:outline-none",
          "prose-headings:text-white/90 prose-headings:font-semibold",
          "prose-p:text-white/70 prose-p:leading-relaxed",
          "prose-a:text-purple-400",
          "prose-strong:text-white/90 prose-strong:font-bold",
          "prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-white/5 prose-pre:text-white/80 prose-pre:border prose-pre:border-white/10",
          "prose-blockquote:border-l-purple-500/50 prose-blockquote:text-white/50 prose-blockquote:italic",
          "prose-ul:text-white/70 prose-ol:text-white/70",
          "prose-li:marker:text-white/30",
          "prose-img:rounded-xl prose-img:my-4",
          "prose-hr:border-white/10",
          "min-h-[300px]",
        ].join(" "),
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(
          editor.getHTML(),
          editor.getText(),
          editor.getJSON() as Record<string, unknown>
        );
      }
    },
  });

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  const getHTML = useCallback(() => editor?.getHTML() ?? "", [editor]);
  const getText = useCallback(() => editor?.getText() ?? "", [editor]);
  const getJSON = useCallback(
    () => (editor?.getJSON() as Record<string, unknown>) ?? {},
    [editor]
  );
  const isEmpty = useCallback(
    () => editor?.isEmpty ?? true,
    [editor]
  );
  const focus = useCallback(() => {
    editor?.chain().focus().run();
  }, [editor]);

  return {
    editor,
    wordCount,
    charCount,
    getHTML,
    getText,
    getJSON,
    isEmpty,
    focus,
  };
}
