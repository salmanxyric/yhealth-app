# Agentic Journal Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain textarea in `DistractionFreeEditor` with a premium TipTap-based rich text editor featuring multimedia blocks, drawing canvas, voice/dictation, three-layer agentic AI, and validation — all in the existing Observatory dark theme.

**Architecture:** Extend the existing TipTap v2.27.2 installation with custom Node extensions for each block type (audio, drawing, video, file, callout). Use TipTap's `Suggestion` plugin for the slash menu, `BubbleMenu` for the floating toolbar, and custom React overlays for the AI pill, drawing canvas modal, and dictation mode. The `DistractionFreeEditor` shell (top bar, status bar, theme) stays intact — only the textarea is replaced.

**Tech Stack:** Next.js 16 + React 19 + TypeScript, TipTap v2.27.2, Fabric.js (lazy-loaded for canvas), Web Speech API (dictation), Framer Motion (animations), Tailwind CSS + Observatory theme.

**Spec:** `docs/superpowers/specs/2026-05-07-agentic-journal-editor-design.md`

---

## File Structure

### New Files

```
client/components/journal/editor/
├── AgenticEditor.tsx                    # TipTap editor instance with all extensions configured
├── useAgenticEditor.ts                  # Hook: creates TipTap editor with extensions, exposes helpers
├── useAutoSave.ts                       # Hook: debounced auto-save with status tracking
├── useValidation.ts                     # Hook: completeness scoring + validation rules
├── useDictation.ts                      # Hook: Web Speech API streaming + voice commands
├── toolbar/
│   ├── BubbleToolbar.tsx                # Floating toolbar on text selection (BubbleMenu)
│   └── toolbar-items.ts                # Button definitions for bubble toolbar
├── slash-menu/
│   ├── slash-menu-extension.ts          # TipTap Suggestion extension config
│   ├── SlashMenuList.tsx                # React renderer for slash menu dropdown
│   └── menu-items.ts                   # All slash command definitions (text, media, AI)
├── extensions/
│   ├── audio-block/
│   │   ├── audio-block-extension.ts     # TipTap Node extension for audio
│   │   └── AudioBlockView.tsx           # NodeView: record, playback, waveform, transcribe
│   ├── drawing-block/
│   │   ├── drawing-block-extension.ts   # TipTap Node extension for drawings
│   │   └── DrawingBlockView.tsx         # NodeView: preview thumbnail + edit trigger
│   ├── video-block/
│   │   ├── video-block-extension.ts     # TipTap Node extension for video embeds
│   │   └── VideoBlockView.tsx           # NodeView: embed iframe or uploaded video
│   ├── file-block/
│   │   ├── file-block-extension.ts      # TipTap Node extension for file attachments
│   │   └── FileBlockView.tsx            # NodeView: metadata card with preview/download
│   ├── callout-block/
│   │   ├── callout-block-extension.ts   # TipTap Node extension for callout boxes
│   │   └── CalloutBlockView.tsx         # NodeView: styled callout with icon
│   └── ai-suggestion/
│       ├── ai-suggestion-extension.ts   # TipTap Node extension for AI output cards
│       └── AISuggestionView.tsx         # NodeView: insert/regenerate/edit/dismiss
├── ai/
│   ├── AIPill.tsx                       # Floating AI pill button + expanded panel
│   ├── AICoachPanel.tsx                 # Expanded panel: insights, chat, quick actions
│   ├── GhostText.tsx                    # Ghost text overlay for inline completions
│   ├── CoachingNudge.tsx                # Toast notification for coaching nudges
│   ├── useGhostText.ts                  # Hook: AI completion logic with rate limiting
│   └── useAICoach.ts                    # Hook: pattern detection, past connections, nudges
├── canvas/
│   ├── DrawingCanvasModal.tsx           # Full-screen Fabric.js overlay modal
│   ├── CanvasToolbar.tsx                # Drawing tools bar (pen, shapes, text, eraser)
│   ├── LayersPanel.tsx                  # Layer management sidebar
│   └── ColorPicker.tsx                  # Observatory-themed color picker
├── dictation/
│   ├── DictationOverlay.tsx             # Floating dictation pill with waveform
│   └── DictationControls.tsx            # Pause/Stop buttons + elapsed time
├── validation/
│   ├── ValidationReview.tsx             # Final save validation modal
│   └── CompletenessBar.tsx              # Status bar completeness percentage
└── media/
    ├── MediaUploader.tsx                # Shared upload logic (progress, retry, cancel)
    ├── ImageUploadDialog.tsx            # Device/URL image picker dialog
    └── media-validators.ts             # File type, size, dimension validation functions
```

### Modified Files

```
client/components/journal/DistractionFreeEditor.tsx   # Replace <textarea> with <AgenticEditor>
shared/types/domain/wellbeing.ts                       # Add rich content fields to JournalEntry
client/src/shared/services/wellbeing.service.ts        # Update createEntry/updateEntry for rich content
client/components/journal/index.ts                     # Re-export new editor components
```

### New Dependencies

```
@tiptap/extension-underline
@tiptap/extension-highlight
@tiptap/extension-text-align
@tiptap/extension-color
@tiptap/extension-text-style
@tiptap/extension-task-list
@tiptap/extension-task-item
@tiptap/extension-placeholder
@tiptap/suggestion
fabric (lazy-loaded)
tippy.js
```

---

## Phase 1: Core Editor Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install TipTap extensions**

```bash
cd client && npm install @tiptap/extension-underline @tiptap/extension-highlight @tiptap/extension-text-align @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-placeholder @tiptap/suggestion tippy.js
```

- [ ] **Step 2: Install Fabric.js**

```bash
cd client && npm install fabric
```

- [ ] **Step 3: Verify installation**

```bash
cd client && npm ls @tiptap/suggestion fabric tippy.js
```

Expected: All three packages listed with versions, no UNMET PEER DEPENDENCY errors.

- [ ] **Step 4: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "chore: add TipTap extensions, Fabric.js, and tippy.js for agentic editor"
```

---

### Task 2: Extend Data Model

**Files:**
- Modify: `shared/types/domain/wellbeing.ts`

- [ ] **Step 1: Add new types to wellbeing.ts**

Add these types after the existing `VoiceEmotionAnalysis` interface (around line 152):

```typescript
// ============================================
// RICH JOURNAL EDITOR TYPES
// ============================================

export interface JournalAttachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  width?: number;
  height?: number;
  caption?: string;
  altText?: string;
  transcription?: string;
  transcriptionStatus?: TranscriptionStatus;
  uploadedAt: string;
}

export interface JournalDrawing {
  id: string;
  fabricJson: string;
  previewUrl: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIInteraction {
  id: string;
  type: 'completion' | 'rewrite' | 'expand' | 'summarize' | 'reframe' | 'prompt' | 'coaching';
  input: string;
  output: string;
  accepted: boolean;
  timestamp: string;
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'warn' | 'block' | 'suggestion';
  message: string;
}

export interface ValidationResult {
  completenessScore: number;
  wordCount: number;
  checks: ValidationCheck[];
}
```

- [ ] **Step 2: Add rich content fields to JournalEntry**

Add these optional fields to the `JournalEntry` interface (after `transcriptionStatus` field, around line 141):

```typescript
  // Rich editor content
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
  attachments?: JournalAttachment[];
  drawings?: JournalDrawing[];
  aiInteractions?: AIInteraction[];
  completenessScore?: number;
  validationResult?: ValidationResult;
  isDraft?: boolean;
  lastAutoSavedAt?: string;
```

- [ ] **Step 3: Verify build**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No new type errors introduced.

- [ ] **Step 4: Commit**

```bash
git add shared/types/domain/wellbeing.ts
git commit -m "feat(types): add rich editor types to JournalEntry (attachments, drawings, AI interactions, validation)"
```

---

### Task 3: Create the TipTap Editor Hook

**Files:**
- Create: `client/components/journal/editor/useAgenticEditor.ts`

- [ ] **Step 1: Create the editor directory**

```bash
mkdir -p client/components/journal/editor
```

- [ ] **Step 2: Write useAgenticEditor.ts**

```typescript
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
```

- [ ] **Step 3: Verify build**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add client/components/journal/editor/useAgenticEditor.ts
git commit -m "feat(editor): create useAgenticEditor hook with TipTap extensions"
```

---

### Task 4: Create AgenticEditor Component

**Files:**
- Create: `client/components/journal/editor/AgenticEditor.tsx`

- [ ] **Step 1: Write AgenticEditor.tsx**

```typescript
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

      {/* Placeholder styling for empty editor */}
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
```

- [ ] **Step 2: Verify build**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add client/components/journal/editor/AgenticEditor.tsx
git commit -m "feat(editor): create AgenticEditor component with TipTap EditorContent"
```

---

### Task 5: Integrate AgenticEditor into DistractionFreeEditor

**Files:**
- Modify: `client/components/journal/DistractionFreeEditor.tsx`

This is the critical swap — replace the `<textarea>` with `<AgenticEditor>` while keeping all the shell UI (top bar, status bar, prompt card, theme).

- [ ] **Step 1: Update imports and props**

In `DistractionFreeEditor.tsx`, add the import and update the props interface:

```typescript
// Add to imports (after existing imports)
import { AgenticEditor } from "./editor/AgenticEditor";
import type { AgenticEditorAPI } from "./editor/useAgenticEditor";
```

Update the props interface — change `value` from `string` to support both plain text and rich content:

```typescript
export interface DistractionFreeEditorProps {
  prompt?: string | null;
  mode: JournalingMode;
  value: string;
  onChange: (text: string) => void;
  onContentChange?: (html: string, text: string, json: Record<string, unknown>) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  autoSaveStatus?: "idle" | "saving" | "saved";
  entryDate?: string;
  onDateChange?: (date: string) => void;
}
```

- [ ] **Step 2: Replace textarea with AgenticEditor**

Replace the `textareaRef`, `handleKeyDown`, `wordCount`, and `charCount` logic. Remove `textareaRef` and add `editorApiRef`:

```typescript
const editorApiRef = useRef<AgenticEditorAPI | null>(null);
```

Replace the word/char count calculations:

```typescript
const wordCount = editorApiRef.current?.wordCount ?? 0;
const charCount = editorApiRef.current?.charCount ?? 0;
```

Replace the `<textarea>` block (the `<motion.div>` around line 285-308) with:

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.35 }}
  className="flex-1 flex flex-col"
>
  <AgenticEditor
    mode={mode}
    initialContent={value}
    onUpdate={(html, text, json) => {
      onChange(text);
      onContentChange?.(html, text, json);
    }}
    onReady={(api) => {
      editorApiRef.current = api;
      setTimeout(() => api.focus(), 400);
    }}
    className="flex-1"
  />
</motion.div>
```

- [ ] **Step 3: Update keyboard shortcut handler**

Replace the textarea `onKeyDown` with a global keyboard handler since the editor handles its own key events. Add a `useEffect` for Ctrl+Enter and Escape:

```typescript
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      const isEmpty = editorApiRef.current?.isEmpty() ?? true;
      if (!isEmpty && !isSubmitting) {
        onSubmit();
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  window.addEventListener("keydown", handleGlobalKeyDown);
  return () => window.removeEventListener("keydown", handleGlobalKeyDown);
}, [isSubmitting, onSubmit, onClose]);
```

Remove the old `handleKeyDown` callback.

- [ ] **Step 4: Update the submit button disabled check**

Replace `value.trim().length === 0` with:

```tsx
disabled={isSubmitting || (editorApiRef.current?.isEmpty() ?? true)}
```

- [ ] **Step 5: Test manually**

```bash
cd client && npm run dev
```

Open the journal, select any journaling mode, and verify:
- The rich editor renders with the Observatory theme
- Typing works with the placeholder showing
- Bold (Ctrl+B), Italic (Ctrl+I), headings, lists all work
- Word and character counts update in the status bar
- Ctrl+Enter saves, Escape closes
- The top bar and status bar remain unchanged

- [ ] **Step 6: Commit**

```bash
git add client/components/journal/DistractionFreeEditor.tsx
git commit -m "feat(editor): replace textarea with AgenticEditor in DistractionFreeEditor"
```

---

## Phase 2: Floating Bubble Toolbar

### Task 6: Create Bubble Toolbar

**Files:**
- Create: `client/components/journal/editor/toolbar/toolbar-items.ts`
- Create: `client/components/journal/editor/toolbar/BubbleToolbar.tsx`

- [ ] **Step 1: Write toolbar-items.ts**

```typescript
import type { Editor } from "@tiptap/react";

export interface ToolbarItem {
  name: string;
  icon: string;
  action: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
  shortcut?: string;
}

export interface ToolbarGroup {
  name: string;
  items: ToolbarItem[];
}

export function getToolbarGroups(): ToolbarGroup[] {
  return [
    {
      name: "format",
      items: [
        {
          name: "Bold",
          icon: "bold",
          action: (e) => e.chain().focus().toggleBold().run(),
          isActive: (e) => e.isActive("bold"),
          shortcut: "Ctrl+B",
        },
        {
          name: "Italic",
          icon: "italic",
          action: (e) => e.chain().focus().toggleItalic().run(),
          isActive: (e) => e.isActive("italic"),
          shortcut: "Ctrl+I",
        },
        {
          name: "Underline",
          icon: "underline",
          action: (e) => e.chain().focus().toggleUnderline().run(),
          isActive: (e) => e.isActive("underline"),
          shortcut: "Ctrl+U",
        },
        {
          name: "Strikethrough",
          icon: "strikethrough",
          action: (e) => e.chain().focus().toggleStrike().run(),
          isActive: (e) => e.isActive("strike"),
        },
        {
          name: "Highlight",
          icon: "highlighter",
          action: (e) => e.chain().focus().toggleHighlight().run(),
          isActive: (e) => e.isActive("highlight"),
          shortcut: "Ctrl+Shift+H",
        },
        {
          name: "Code",
          icon: "code",
          action: (e) => e.chain().focus().toggleCode().run(),
          isActive: (e) => e.isActive("code"),
          shortcut: "Ctrl+E",
        },
      ],
    },
    {
      name: "heading",
      items: [
        {
          name: "Heading 1",
          icon: "heading-1",
          action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: (e) => e.isActive("heading", { level: 1 }),
        },
        {
          name: "Heading 2",
          icon: "heading-2",
          action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: (e) => e.isActive("heading", { level: 2 }),
        },
      ],
    },
    {
      name: "link",
      items: [
        {
          name: "Link",
          icon: "link",
          action: (e) => {
            const url = window.prompt("Enter URL:");
            if (url) {
              e.chain().focus().setLink({ href: url }).run();
            }
          },
          isActive: (e) => e.isActive("link"),
          shortcut: "Ctrl+K",
        },
      ],
    },
  ];
}
```

- [ ] **Step 2: Create toolbar directory**

```bash
mkdir -p client/components/journal/editor/toolbar
```

- [ ] **Step 3: Write BubbleToolbar.tsx**

```typescript
"use client";

import { BubbleMenu, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Heading1,
  Heading2,
  Link,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolbarGroups } from "./toolbar-items";

const ICON_MAP: Record<string, LucideIcon> = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  highlighter: Highlighter,
  code: Code,
  "heading-1": Heading1,
  "heading-2": Heading2,
  link: Link,
};

interface BubbleToolbarProps {
  editor: Editor;
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const groups = getToolbarGroups();

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: "top",
        animation: "shift-toward-subtle",
      }}
      className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg border border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10"
    >
      {groups.map((group, gi) => (
        <div key={group.name} className="flex items-center">
          {gi > 0 && (
            <div className="w-px h-5 bg-white/10 mx-1" />
          )}
          {group.items.map((item) => {
            const Icon = ICON_MAP[item.icon];
            if (!Icon) return null;
            const active = item.isActive(editor);

            return (
              <button
                key={item.name}
                onClick={() => item.action(editor)}
                title={item.shortcut ? `${item.name} (${item.shortcut})` : item.name}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-150",
                  active
                    ? "bg-purple-500/25 text-purple-300"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      ))}
    </BubbleMenu>
  );
}
```

- [ ] **Step 4: Wire BubbleToolbar into AgenticEditor**

In `AgenticEditor.tsx`, add after the `<EditorContent>`:

```typescript
// Add import
import { BubbleToolbar } from "./toolbar/BubbleToolbar";

// Inside the component JSX, after <EditorContent>:
{api.editor && <BubbleToolbar editor={api.editor} />}
```

- [ ] **Step 5: Test manually**

Open the journal editor, type some text, select a portion. Verify:
- Floating toolbar appears above the selection
- Bold, italic, underline, strikethrough, highlight, code all toggle
- Heading 1/2 toggles work
- Link prompts for URL and applies
- Active states highlight in purple
- Toolbar disappears when text is deselected

- [ ] **Step 6: Commit**

```bash
git add client/components/journal/editor/toolbar/
git add client/components/journal/editor/AgenticEditor.tsx
git commit -m "feat(editor): add floating bubble toolbar with formatting options"
```

---

## Phase 3: Slash Menu

### Task 7: Create Slash Menu

**Files:**
- Create: `client/components/journal/editor/slash-menu/menu-items.ts`
- Create: `client/components/journal/editor/slash-menu/SlashMenuList.tsx`
- Create: `client/components/journal/editor/slash-menu/slash-menu-extension.ts`

- [ ] **Step 1: Create slash-menu directory**

```bash
mkdir -p client/components/journal/editor/slash-menu
```

- [ ] **Step 2: Write menu-items.ts**

```typescript
import type { Editor } from "@tiptap/react";

export interface SlashMenuItem {
  title: string;
  description: string;
  icon: string;
  category: "text" | "lists" | "media" | "ai" | "divider";
  action: (editor: Editor) => void;
}

export function getSlashMenuItems(): SlashMenuItem[] {
  return [
    // Text
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: "heading-1",
      category: "text",
      action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: "heading-2",
      category: "text",
      action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: "heading-3",
      category: "text",
      action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Blockquote",
      description: "Capture a quote",
      icon: "quote",
      category: "text",
      action: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Code Block",
      description: "Code with syntax highlighting",
      icon: "code-2",
      category: "text",
      action: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
    // Lists
    {
      title: "Bullet List",
      description: "Unordered list",
      icon: "list",
      category: "lists",
      action: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Ordered list",
      icon: "list-ordered",
      category: "lists",
      action: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Task List",
      description: "Checklist with checkboxes",
      icon: "list-checks",
      category: "lists",
      action: (e) => e.chain().focus().toggleTaskList().run(),
    },
    // Media (placeholders — will wire up in later tasks)
    {
      title: "Image",
      description: "Upload or embed an image",
      icon: "image",
      category: "media",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:image"));
      },
    },
    {
      title: "Audio Recording",
      description: "Record a voice clip",
      icon: "mic",
      category: "media",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:audio"));
      },
    },
    {
      title: "Drawing Canvas",
      description: "Open the drawing tool",
      icon: "pencil-ruler",
      category: "media",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:drawing"));
      },
    },
    {
      title: "Video Embed",
      description: "Embed a YouTube or Vimeo video",
      icon: "video",
      category: "media",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:video"));
      },
    },
    {
      title: "File Attachment",
      description: "Attach a document",
      icon: "paperclip",
      category: "media",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:file"));
      },
    },
    // Dividers
    {
      title: "Horizontal Rule",
      description: "Visual separator",
      icon: "minus",
      category: "divider",
      action: (e) => e.chain().focus().setHorizontalRule().run(),
    },
    // AI commands
    {
      title: "AI Continue",
      description: "Let AI continue your writing",
      icon: "sparkles",
      category: "ai",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:ai-continue"));
      },
    },
    {
      title: "AI Rewrite",
      description: "Rewrite selected text with AI",
      icon: "refresh-cw",
      category: "ai",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:ai-rewrite"));
      },
    },
    {
      title: "AI Expand",
      description: "Elaborate on the current thought",
      icon: "maximize-2",
      category: "ai",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:ai-expand"));
      },
    },
    {
      title: "AI Reframe",
      description: "CBT cognitive reframe",
      icon: "rotate-3d",
      category: "ai",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:ai-reframe"));
      },
    },
    {
      title: "AI Prompt",
      description: "Generate a follow-up prompt",
      icon: "message-circle",
      category: "ai",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:ai-prompt"));
      },
    },
    {
      title: "Dictation Mode",
      description: "Start voice-to-text dictation",
      icon: "mic-vocal",
      category: "ai",
      action: () => {
        document.dispatchEvent(new CustomEvent("slash-menu:dictation"));
      },
    },
  ];
}

export function filterSlashMenuItems(items: SlashMenuItem[], query: string): SlashMenuItem[] {
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );
}
```

- [ ] **Step 3: Write SlashMenuList.tsx**

```typescript
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  List,
  ListOrdered,
  ListChecks,
  ImageIcon,
  Mic,
  PencilRuler,
  Video,
  Paperclip,
  Minus,
  Sparkles,
  RefreshCw,
  Maximize2,
  Rotate3d,
  MessageCircle,
  MicVocal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlashMenuItem } from "./menu-items";

const ICON_MAP: Record<string, LucideIcon> = {
  "heading-1": Heading1,
  "heading-2": Heading2,
  "heading-3": Heading3,
  quote: Quote,
  "code-2": Code2,
  list: List,
  "list-ordered": ListOrdered,
  "list-checks": ListChecks,
  image: ImageIcon,
  mic: Mic,
  "pencil-ruler": PencilRuler,
  video: Video,
  paperclip: Paperclip,
  minus: Minus,
  sparkles: Sparkles,
  "refresh-cw": RefreshCw,
  "maximize-2": Maximize2,
  "rotate-3d": Rotate3d,
  "message-circle": MessageCircle,
  "mic-vocal": MicVocal,
};

const CATEGORY_LABELS: Record<string, string> = {
  text: "Text",
  lists: "Lists",
  media: "Media",
  ai: "AI Assistant",
  divider: "Dividers",
};

interface SlashMenuListProps {
  items: SlashMenuItem[];
  command: (item: SlashMenuItem) => void;
}

export interface SlashMenuListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashMenuList = forwardRef<SlashMenuListRef, SlashMenuListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="px-3 py-2 text-white/30 text-sm observatory-font-body">
          No results
        </div>
      );
    }

    const categories = [...new Set(items.map((i) => i.category))];

    let globalIndex = 0;

    return (
      <div className="w-72 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-[#0e0a22]/98 backdrop-blur-xl shadow-2xl shadow-purple-500/10 py-1 observatory-scroll">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          return (
            <div key={cat}>
              <div
                className="px-3 pt-2 pb-1 observatory-font-display text-white/20"
                style={{ fontSize: 9, letterSpacing: "0.12em" }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </div>
              {catItems.map((item) => {
                const itemIndex = globalIndex++;
                const Icon = ICON_MAP[item.icon];
                return (
                  <button
                    key={item.title}
                    onClick={() => selectItem(itemIndex)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 text-left transition-colors",
                      itemIndex === selectedIndex
                        ? "bg-purple-500/15 text-white/90"
                        : "text-white/50 hover:bg-white/5"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        itemIndex === selectedIndex
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-white/5 text-white/30"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate observatory-font-body">
                        {item.title}
                      </div>
                      <div
                        className="text-white/25 truncate"
                        style={{ fontSize: 11 }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
);

SlashMenuList.displayName = "SlashMenuList";
```

- [ ] **Step 4: Write slash-menu-extension.ts**

```typescript
import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { SlashMenuList, type SlashMenuListRef } from "./SlashMenuList";
import { getSlashMenuItems, filterSlashMenuItems, type SlashMenuItem } from "./menu-items";

export const SlashMenuExtension = Extension.create({
  name: "slashMenu",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: any; range: any; props: SlashMenuItem }) => {
          editor.chain().focus().deleteRange(range).run();
          props.action(editor);
        },
        items: ({ query }: { query: string }) => {
          return filterSlashMenuItems(getSlashMenuItems(), query);
        },
        render: () => {
          let component: ReactRenderer<SlashMenuListRef> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashMenuList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                animation: false,
              });
            },
            onUpdate(props: any) {
              component?.updateProps(props);
              if (props.clientRect && popup?.[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },
            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      } satisfies Partial<SuggestionOptions<SlashMenuItem>>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
```

- [ ] **Step 5: Add SlashMenuExtension to useAgenticEditor**

In `useAgenticEditor.ts`, add the import and include the extension:

```typescript
// Add import
import { SlashMenuExtension } from "./slash-menu/slash-menu-extension";

// Add to the extensions array (after CharacterCount):
SlashMenuExtension,
```

- [ ] **Step 6: Test manually**

Open the journal editor, type `/`. Verify:
- Slash menu appears below the cursor
- Items are categorized (Text, Lists, Media, AI Assistant, Dividers)
- Arrow keys navigate, Enter selects
- Typing filters items (e.g., `/head` shows only headings)
- Selecting "Heading 1" converts current block to H1
- Escape closes the menu
- AI items dispatch custom events (check console for now)

- [ ] **Step 7: Commit**

```bash
git add client/components/journal/editor/slash-menu/
git add client/components/journal/editor/useAgenticEditor.ts
git commit -m "feat(editor): add slash command menu with text, media, and AI commands"
```

---

## Phase 4: Auto-Save & Validation

### Task 8: Create Auto-Save Hook

**Files:**
- Create: `client/components/journal/editor/useAutoSave.ts`

- [ ] **Step 1: Write useAutoSave.ts**

```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  data: {
    html: string;
    text: string;
    json: Record<string, unknown>;
  } | null;
  onSave: (data: { html: string; text: string; json: Record<string, unknown> }) => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  forceSave: () => Promise<void>;
}

export function useAutoSave({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedDataRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback(async () => {
    if (!data || !enabled) return;

    const dataHash = data.text;
    if (dataHash === lastSavedDataRef.current) return;
    if (data.text.trim().length === 0) return;

    setStatus("saving");
    try {
      await onSave(data);
      lastSavedDataRef.current = dataHash;
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(save, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save, interval, enabled]);

  // Save on blur
  useEffect(() => {
    if (!enabled) return;

    let blurTimer: ReturnType<typeof setTimeout>;
    const handleBlur = () => {
      blurTimer = setTimeout(save, 5000);
    };
    const handleFocus = () => {
      clearTimeout(blurTimer);
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      clearTimeout(blurTimer);
    };
  }, [save, enabled]);

  // Emergency save on unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      if (data && data.text.trim().length > 0 && data.text !== lastSavedDataRef.current) {
        try {
          localStorage.setItem(
            "journal-emergency-save",
            JSON.stringify({ ...data, timestamp: new Date().toISOString() })
          );
        } catch { /* localStorage full — best effort */ }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, enabled]);

  return { status, lastSavedAt, forceSave: save };
}
```

- [ ] **Step 2: Verify build**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add client/components/journal/editor/useAutoSave.ts
git commit -m "feat(editor): add auto-save hook with interval, blur, and emergency save"
```

---

### Task 9: Create Validation Hook & UI

**Files:**
- Create: `client/components/journal/editor/useValidation.ts`
- Create: `client/components/journal/editor/validation/CompletenessBar.tsx`
- Create: `client/components/journal/editor/validation/ValidationReview.tsx`

- [ ] **Step 1: Write useValidation.ts**

```typescript
"use client";

import { useMemo } from "react";
import type { JournalingMode, ValidationCheck, ValidationResult } from "@shared/types/domain/wellbeing";

const WORD_TARGETS: Record<JournalingMode, number> = {
  quick_reflection: 50,
  deep_dive: 200,
  gratitude: 80,
  life_perspective: 150,
  free_write: 100,
  voice_conversation: 50,
};

const WORD_MINIMUMS: Record<JournalingMode, number> = {
  quick_reflection: 20,
  deep_dive: 50,
  gratitude: 30,
  life_perspective: 30,
  free_write: 20,
  voice_conversation: 10,
};

interface UseValidationOptions {
  text: string;
  html: string;
  mode: JournalingMode;
  hasMedia?: boolean;
  hasUnsavedCanvas?: boolean;
  pendingUploads?: number;
}

export function useValidation({
  text,
  html,
  mode,
  hasMedia = false,
  hasUnsavedCanvas = false,
  pendingUploads = 0,
}: UseValidationOptions): ValidationResult {
  return useMemo(() => {
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const checks: ValidationCheck[] = [];

    // Blocker: empty entry
    if (wordCount === 0) {
      checks.push({
        name: "Content",
        status: "block",
        message: "Cannot save an empty entry",
      });
    }

    // Blocker: pending uploads
    if (pendingUploads > 0) {
      checks.push({
        name: "Uploads",
        status: "block",
        message: `${pendingUploads} upload(s) still in progress`,
      });
    }

    // Warning: minimum words
    const minWords = WORD_MINIMUMS[mode];
    if (wordCount > 0 && wordCount < minWords) {
      checks.push({
        name: "Word count",
        status: "warn",
        message: `${wordCount} words — minimum ${minWords} for ${mode.replace("_", " ")}`,
      });
    } else if (wordCount >= minWords) {
      checks.push({
        name: "Word count",
        status: "pass",
        message: `${wordCount} words (minimum ${minWords} met)`,
      });
    }

    // Warning: unsaved canvas
    if (hasUnsavedCanvas) {
      checks.push({
        name: "Drawing",
        status: "warn",
        message: "Drawing canvas has unsaved changes",
      });
    }

    // Completeness score
    const target = WORD_TARGETS[mode];
    const wordScore = Math.min(wordCount / target, 1) * 40;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueWords = new Set(text.toLowerCase().match(/\b[a-z]+\b/g) ?? []);
    const depthScore = Math.min(
      ((sentences.length / 5) * 10 + (uniqueWords.size / 30) * 10),
      20
    );

    const hasHeadings = /<h[1-3]/i.test(html);
    const hasLists = /<[uo]l/i.test(html);
    const structureScore = (hasHeadings ? 5 : 0) + (hasLists ? 5 : 0);

    const mediaScore = hasMedia ? 10 : 0;

    const reflectiveWords = ["feel", "think", "realize", "notice", "wonder", "grateful", "reflect", "learn"];
    const hasReflection = reflectiveWords.some((w) => text.toLowerCase().includes(w));
    const reflectionScore = hasReflection ? 5 : 0;

    const promptScore = wordCount > 0 ? 15 : 0;

    const completenessScore = Math.round(
      wordScore + depthScore + structureScore + mediaScore + reflectionScore + promptScore
    );

    return {
      completenessScore: Math.min(completenessScore, 100),
      wordCount,
      checks,
    };
  }, [text, html, mode, hasMedia, hasUnsavedCanvas, pendingUploads]);
}
```

- [ ] **Step 2: Create validation directory**

```bash
mkdir -p client/components/journal/editor/validation
```

- [ ] **Step 3: Write CompletenessBar.tsx**

```typescript
"use client";

import { cn } from "@/lib/utils";

interface CompletenessBarProps {
  score: number;
}

export function CompletenessBar({ score }: CompletenessBarProps) {
  const color =
    score < 30
      ? "bg-red-500/60"
      : score < 60
        ? "bg-amber-500/60"
        : "bg-emerald-500/60";

  const textColor =
    score < 30
      ? "text-red-400/40"
      : score < 60
        ? "text-amber-400/40"
        : "text-emerald-400/40";

  return (
    <button
      className="flex items-center gap-2 group cursor-default"
      title={`Completeness: ${score}%`}
    >
      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={cn("observatory-font-display", textColor)}
        style={{ fontSize: 9, letterSpacing: "0.1em" }}
      >
        {score}%
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Write ValidationReview.tsx**

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@shared/types/domain/wellbeing";

interface ValidationReviewProps {
  result: ValidationResult;
  isOpen: boolean;
  onClose: () => void;
  onSaveAnyway: () => void;
  onGoBack: () => void;
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  block: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  suggestion: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export function ValidationReview({
  result,
  isOpen,
  onClose,
  onSaveAnyway,
  onGoBack,
}: ValidationReviewProps) {
  const hasBlockers = result.checks.some((c) => c.status === "block");
  const hasWarnings = result.checks.some((c) => c.status === "warn");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 2, 10, 0.8)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0a22] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="observatory-font-display text-white/80"
                style={{ fontSize: 12, letterSpacing: "0.15em" }}
              >
                ENTRY REVIEW
              </h2>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Completeness bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-sm">Completeness</span>
                <span className="text-white/60 text-sm font-medium">{result.completenessScore}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    result.completenessScore < 30
                      ? "bg-red-500/60"
                      : result.completenessScore < 60
                        ? "bg-amber-500/60"
                        : "bg-emerald-500/60"
                  )}
                  style={{ width: `${result.completenessScore}%` }}
                />
              </div>
            </div>

            {/* Checks */}
            <div className="space-y-2 mb-6">
              {result.checks.map((check, i) => {
                const config = STATUS_CONFIG[check.status];
                const Icon = config.icon;
                return (
                  <div
                    key={i}
                    className={cn("flex items-start gap-3 px-3 py-2.5 rounded-lg", config.bg)}
                  >
                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
                    <div>
                      <span className={cn("text-sm font-medium", config.color)}>{check.name}</span>
                      <p className="text-white/40 text-sm">{check.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onGoBack}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-all text-sm"
              >
                Go Back & Edit
              </button>
              <button
                onClick={onSaveAnyway}
                disabled={hasBlockers}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  hasBlockers
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : hasWarnings
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                      : "bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30"
                )}
              >
                {hasBlockers ? "Fix Blockers First" : hasWarnings ? "Save Anyway" : "Save Entry"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add client/components/journal/editor/useValidation.ts
git add client/components/journal/editor/validation/
git commit -m "feat(editor): add validation hook, completeness bar, and validation review modal"
```

---

### Task 10: Wire Auto-Save & Validation into DistractionFreeEditor

**Files:**
- Modify: `client/components/journal/DistractionFreeEditor.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useAutoSave, type AutoSaveStatus } from "./editor/useAutoSave";
import { useValidation } from "./editor/useValidation";
import { CompletenessBar } from "./editor/validation/CompletenessBar";
import { ValidationReview } from "./editor/validation/ValidationReview";
```

- [ ] **Step 2: Add state for rich content tracking and validation**

Inside the component, add:

```typescript
const [richContent, setRichContent] = useState<{
  html: string;
  text: string;
  json: Record<string, unknown>;
} | null>(null);

const [showValidation, setShowValidation] = useState(false);

const validation = useValidation({
  text: richContent?.text ?? value,
  html: richContent?.html ?? "",
  mode,
});

const autoSave = useAutoSave({
  data: richContent,
  onSave: async (data) => {
    // Auto-save as draft — will wire to API in later task
    onChange(data.text);
    onContentChange?.(data.html, data.text, data.json);
  },
  enabled: true,
});
```

- [ ] **Step 3: Update AgenticEditor onUpdate callback**

```tsx
<AgenticEditor
  mode={mode}
  initialContent={value}
  onUpdate={(html, text, json) => {
    onChange(text);
    onContentChange?.(html, text, json);
    setRichContent({ html, text, json });
  }}
  onReady={(api) => {
    editorApiRef.current = api;
    setTimeout(() => api.focus(), 400);
  }}
  className="flex-1"
/>
```

- [ ] **Step 4: Update the submit handler to show validation**

Replace the direct `onSubmit()` call in the Ctrl+Enter handler and button with:

```typescript
const handleSave = useCallback(() => {
  const hasBlockers = validation.checks.some((c) => c.status === "block");
  if (hasBlockers || validation.checks.some((c) => c.status === "warn")) {
    setShowValidation(true);
  } else {
    onSubmit();
  }
}, [validation, onSubmit]);
```

Update the Ctrl+Enter handler to call `handleSave()` and update the Save button's `onClick` to `handleSave`.

- [ ] **Step 5: Add CompletenessBar to status bar**

In the bottom status bar, between words/chars and the timer, add:

```tsx
<CompletenessBar score={validation.completenessScore} />
```

- [ ] **Step 6: Update the auto-save badge**

Replace the `autoSaveStatus` prop usage with:

```tsx
<AutoSaveBadge status={autoSave.status === "error" ? "idle" : autoSave.status === "saved" ? "saved" : autoSave.status === "saving" ? "saving" : "idle"} />
```

- [ ] **Step 7: Add ValidationReview modal**

Add before the closing `</motion.div>` of the component:

```tsx
<ValidationReview
  result={validation}
  isOpen={showValidation}
  onClose={() => setShowValidation(false)}
  onSaveAnyway={() => {
    setShowValidation(false);
    onSubmit();
  }}
  onGoBack={() => setShowValidation(false)}
/>
```

- [ ] **Step 8: Test manually**

Verify:
- Completeness bar shows in status bar and updates as you type
- Ctrl+Enter on short text shows validation review with warnings
- Validation review shows blockers (empty entry), warnings (low word count)
- "Save Anyway" works for warnings, disabled for blockers
- Auto-save badge cycles through saving/saved states

- [ ] **Step 9: Commit**

```bash
git add client/components/journal/DistractionFreeEditor.tsx
git commit -m "feat(editor): wire auto-save, validation, and completeness scoring into editor"
```

---

## Phase 5: Media Blocks

### Task 11: Create Media Upload Infrastructure

**Files:**
- Create: `client/components/journal/editor/media/media-validators.ts`
- Create: `client/components/journal/editor/media/MediaUploader.tsx`

- [ ] **Step 1: Create media directory**

```bash
mkdir -p client/components/journal/editor/media
```

- [ ] **Step 2: Write media-validators.ts**

```typescript
export interface MediaValidation {
  valid: boolean;
  error?: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const AUDIO_TYPES = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/mpeg"];
const FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/json",
];

const LIMITS = {
  image: { maxSize: 10 * 1024 * 1024, maxDimension: 4000 },
  video: { maxSize: 50 * 1024 * 1024, maxDuration: 30 * 60 },
  audio: { maxSize: 20 * 1024 * 1024, maxDuration: 10 * 60 },
  file: { maxSize: 25 * 1024 * 1024 },
  totalAttachments: 20,
  totalSize: 100 * 1024 * 1024,
} as const;

export function validateImage(file: File): MediaValidation {
  if (!IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported image format: ${file.type}. Use JPG, PNG, GIF, WebP, or SVG.` };
  }
  if (file.size > LIMITS.image.maxSize) {
    return { valid: false, error: `Image too large: ${formatSize(file.size)}. Maximum is 10MB.` };
  }
  return { valid: true };
}

export function validateVideo(file: File): MediaValidation {
  if (!VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported video format: ${file.type}. Use MP4 or WebM.` };
  }
  if (file.size > LIMITS.video.maxSize) {
    return { valid: false, error: `Video too large: ${formatSize(file.size)}. Maximum is 50MB.` };
  }
  return { valid: true };
}

export function validateAudio(file: File): MediaValidation {
  if (!AUDIO_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported audio format: ${file.type}. Use WebM, MP4, or MP3.` };
  }
  if (file.size > LIMITS.audio.maxSize) {
    return { valid: false, error: `Audio too large: ${formatSize(file.size)}. Maximum is 20MB.` };
  }
  return { valid: true };
}

export function validateFile(file: File): MediaValidation {
  if (!FILE_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Use PDF, DOCX, TXT, CSV, or JSON.` };
  }
  if (file.size > LIMITS.file.maxSize) {
    return { valid: false, error: `File too large: ${formatSize(file.size)}. Maximum is 25MB.` };
  }
  return { valid: true };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { LIMITS };
```

- [ ] **Step 3: Write MediaUploader.tsx**

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSize } from "./media-validators";
import { api } from "@/lib/api-client";

export type UploadStatus = "idle" | "uploading" | "complete" | "error";

interface UploadState {
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
}

interface MediaUploaderProps {
  accept: string;
  maxSize: number;
  onUpload: (url: string, file: File) => void;
  onError?: (error: string) => void;
  validate?: (file: File) => { valid: boolean; error?: string };
  children?: React.ReactNode;
  className?: string;
}

export function MediaUploader({
  accept,
  maxSize,
  onUpload,
  onError,
  validate,
  children,
  className,
}: MediaUploaderProps) {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (validate) {
        const result = validate(file);
        if (!result.valid) {
          onError?.(result.error ?? "Validation failed");
          setState({ status: "error", progress: 0, error: result.error });
          return;
        }
      }

      if (file.size > maxSize) {
        const msg = `File too large: ${formatSize(file.size)}. Maximum: ${formatSize(maxSize)}`;
        onError?.(msg);
        setState({ status: "error", progress: 0, error: msg });
        return;
      }

      setState({ status: "uploading", progress: 0 });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post<{ publicUrl?: string; url: string }>(
          "/upload/journal",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (response.success && response.data) {
          const url = response.data.publicUrl || response.data.url;
          setState({ status: "complete", progress: 100, url });
          onUpload(url, file);
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        setState({ status: "error", progress: 0, error: "Upload failed. Try again." });
        onError?.("Upload failed");
      }
    },
    [validate, maxSize, onUpload, onError]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload]
  );

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {children ? (
        <div onClick={() => inputRef.current?.click()} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/70 hover:border-white/20 transition-all text-sm"
        >
          {state.status === "uploading" ? (
            <div className="w-4 h-4 border-2 border-white/10 border-t-purple-500/50 rounded-full animate-spin" />
          ) : state.status === "complete" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : state.status === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>
            {state.status === "uploading"
              ? "Uploading..."
              : state.status === "complete"
                ? "Uploaded"
                : state.status === "error"
                  ? "Retry"
                  : "Choose file"}
          </span>
        </button>
      )}

      {state.status === "error" && state.error && (
        <p className="text-red-400/70 text-xs mt-1">{state.error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add client/components/journal/editor/media/
git commit -m "feat(editor): add media validators and uploader component"
```

---

### Task 12: Create Audio Block Extension

**Files:**
- Create: `client/components/journal/editor/extensions/audio-block/audio-block-extension.ts`
- Create: `client/components/journal/editor/extensions/audio-block/AudioBlockView.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p client/components/journal/editor/extensions/audio-block
```

- [ ] **Step 2: Write audio-block-extension.ts**

```typescript
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AudioBlockView } from "./AudioBlockView";

export interface AudioBlockAttributes {
  audioUrl: string | null;
  duration: number;
  transcription: string;
  isRecording: boolean;
}

export const AudioBlock = Node.create({
  name: "audioBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      audioUrl: { default: null },
      duration: { default: 0 },
      transcription: { default: "" },
      isRecording: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "audio-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioBlockView);
  },
});
```

- [ ] **Step 3: Write AudioBlockView.tsx**

```typescript
"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "../../../voice/useVoiceRecorder";

export function AudioBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { audioUrl, duration, transcription, isRecording } = node.attrs;
  const recorder = useVoiceRecorder();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(audioUrl);

  // Auto-create blob URL when recording stops
  useEffect(() => {
    if (recorder.state === "stopped" && recorder.audioBlob) {
      const url = URL.createObjectURL(recorder.audioBlob);
      setLocalAudioUrl(url);
      updateAttributes({
        audioUrl: url,
        duration: recorder.durationMs,
        isRecording: false,
      });
    }
  }, [recorder.state, recorder.audioBlob]);

  // Start recording on mount if isRecording is true
  useEffect(() => {
    if (isRecording && recorder.state === "idle") {
      recorder.startRecording();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime * 1000);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [localAudioUrl]);

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const durationMs = duration || recorder.durationMs;
  const progress = durationMs > 0 ? (currentTime / durationMs) * 100 : 0;

  return (
    <NodeViewWrapper className="my-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {/* Recording state */}
        {recorder.state === "recording" && (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
              <Mic className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-white/60 text-sm">Recording...</div>
              <div className="text-white/30 text-xs">{formatMs(Date.now() - (recorder as any).startTimeRef?.current || 0)}</div>
            </div>
            <button
              onClick={() => recorder.stopRecording()}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Playback state */}
        {localAudioUrl && recorder.state !== "recording" && (
          <>
            <audio ref={audioRef} src={localAudioUrl} preload="metadata" />
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/50 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-white/20 text-xs">{formatMs(currentTime)}</span>
                  <span className="text-white/20 text-xs">{formatMs(durationMs)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    updateAttributes({ transcription: "Transcribing..." });
                    // TODO: Wire to transcription API
                  }}
                  title="Transcribe"
                  className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={deleteNode}
                  title="Delete"
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transcription */}
            {transcription && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-white/20 text-xs mb-1 observatory-font-display" style={{ letterSpacing: "0.1em" }}>
                  TRANSCRIPTION
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{transcription}</p>
              </div>
            )}
          </>
        )}

        {/* Permission denied */}
        {recorder.permission === "denied" && (
          <div className="text-amber-400/60 text-sm text-center py-2">
            Microphone access denied. Check browser permissions.
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 4: Add AudioBlock to editor extensions**

In `useAgenticEditor.ts`, add:

```typescript
import { AudioBlock } from "./extensions/audio-block/audio-block-extension";

// Add to extensions array:
AudioBlock,
```

- [ ] **Step 5: Wire slash menu audio command**

In `menu-items.ts`, update the "Audio Recording" action:

```typescript
action: (editor) => {
  editor.chain().focus().insertContent({
    type: "audioBlock",
    attrs: { isRecording: true },
  }).run();
},
```

Remove the `document.dispatchEvent` line for the audio item.

- [ ] **Step 6: Test manually**

Type `/audio` in the editor. Verify:
- Audio block appears with recording indicator
- Browser prompts for microphone permission
- Stop button ends recording
- Playback works with progress bar
- Delete button removes the block

- [ ] **Step 7: Commit**

```bash
git add client/components/journal/editor/extensions/audio-block/
git add client/components/journal/editor/useAgenticEditor.ts
git add client/components/journal/editor/slash-menu/menu-items.ts
git commit -m "feat(editor): add audio block extension with record, playback, and transcription"
```

---

### Task 13: Create Image Upload Dialog & Image Block Wiring

**Files:**
- Create: `client/components/journal/editor/media/ImageUploadDialog.tsx`

- [ ] **Step 1: Write ImageUploadDialog.tsx**

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Link, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImage, formatSize } from "./media-validators";
import { api } from "@/lib/api-client";

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt?: string) => void;
}

export function ImageUploadDialog({ isOpen, onClose, onInsert }: ImageUploadDialogProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error ?? "Invalid file");
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<{ publicUrl?: string; url: string }>(
          "/upload/journal",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (response.success && response.data) {
          onInsert(response.data.publicUrl || response.data.url, alt || file.name);
          onClose();
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [alt, onInsert, onClose]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 2, 10, 0.8)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0a22] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="observatory-font-display text-white/80" style={{ fontSize: 12, letterSpacing: "0.15em" }}>
                INSERT IMAGE
              </h2>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/5 mb-4">
              {(["upload", "url"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition-all",
                    tab === t ? "bg-purple-500/20 text-purple-300" : "text-white/40 hover:text-white/60"
                  )}
                >
                  {t === "upload" ? <Upload className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                  {t === "upload" ? "Upload" : "URL"}
                </button>
              ))}
            </div>

            {tab === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragActive ? "border-purple-500/50 bg-purple-500/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
                <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm mb-1">
                  {uploading ? "Uploading..." : "Drop image here or click to browse"}
                </p>
                <p className="text-white/20 text-xs">JPG, PNG, GIF, WebP, SVG — max 10MB</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/30"
                />
                <button
                  onClick={() => { if (url) { onInsert(url, alt); onClose(); } }}
                  disabled={!url}
                  className="w-full py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-30"
                >
                  Insert Image
                </button>
              </div>
            )}

            {/* Alt text */}
            <div className="mt-3">
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Alt text (optional)"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 placeholder:text-white/15 text-sm focus:outline-none focus:border-purple-500/30"
              />
            </div>

            {error && <p className="text-red-400/70 text-xs mt-2">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Wire image dialog into AgenticEditor**

In `AgenticEditor.tsx`, add:

```typescript
import { ImageUploadDialog } from "./media/ImageUploadDialog";

// Add state
const [showImageDialog, setShowImageDialog] = useState(false);

// Listen for slash menu image event
useEffect(() => {
  const handler = () => setShowImageDialog(true);
  document.addEventListener("slash-menu:image", handler);
  return () => document.removeEventListener("slash-menu:image", handler);
}, []);

// Add to JSX (before the closing motion.div):
<ImageUploadDialog
  isOpen={showImageDialog}
  onClose={() => setShowImageDialog(false)}
  onInsert={(url, alt) => {
    api.editor?.chain().focus().setImage({ src: url, alt: alt || "" }).run();
  }}
/>
```

- [ ] **Step 3: Test manually**

Type `/image` in the editor. Verify:
- Upload dialog opens with upload/URL tabs
- Drag & drop works
- URL insertion works
- Image appears inline in editor
- Alt text is preserved

- [ ] **Step 4: Commit**

```bash
git add client/components/journal/editor/media/ImageUploadDialog.tsx
git add client/components/journal/editor/AgenticEditor.tsx
git commit -m "feat(editor): add image upload dialog with drag-drop, URL, and alt text"
```

---

### Task 14: Create Video Block Extension

**Files:**
- Create: `client/components/journal/editor/extensions/video-block/video-block-extension.ts`
- Create: `client/components/journal/editor/extensions/video-block/VideoBlockView.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p client/components/journal/editor/extensions/video-block
```

- [ ] **Step 2: Write video-block-extension.ts**

```typescript
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VideoBlockView } from "./VideoBlockView";

export const VideoBlock = Node.create({
  name: "videoBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      type: { default: "embed" as "embed" | "upload" },
      provider: { default: null as string | null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoBlockView);
  },
});
```

- [ ] **Step 3: Write VideoBlockView.tsx**

```typescript
"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Video, Trash2, Link } from "lucide-react";
import { cn } from "@/lib/utils";

function getEmbedUrl(url: string): { embedUrl: string; provider: string } | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`, provider: "YouTube" };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, provider: "Vimeo" };

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([\w]+)/);
  if (loomMatch) return { embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`, provider: "Loom" };

  return null;
}

export function VideoBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { src, provider } = node.attrs;
  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!src) {
    return (
      <NodeViewWrapper className="my-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-5 h-5 text-white/30" />
            <span className="text-white/40 text-sm">Embed a video</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste YouTube, Vimeo, or Loom URL..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const result = getEmbedUrl(inputUrl);
                  if (result) {
                    updateAttributes({ src: result.embedUrl, provider: result.provider, type: "embed" });
                  } else {
                    setError("Unsupported URL. Use YouTube, Vimeo, or Loom links.");
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const result = getEmbedUrl(inputUrl);
                if (result) {
                  updateAttributes({ src: result.embedUrl, provider: result.provider, type: "embed" });
                } else {
                  setError("Unsupported URL");
                }
              }}
              className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-sm"
            >
              <Link className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-red-400/60 text-xs mt-2">{error}</p>}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={src}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
          <span className="text-white/20 text-xs">{provider || "Video"}</span>
          <button
            onClick={deleteNode}
            className="p-1 rounded text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 4: Add VideoBlock to editor and wire slash menu**

In `useAgenticEditor.ts`:

```typescript
import { VideoBlock } from "./extensions/video-block/video-block-extension";

// Add to extensions array:
VideoBlock,
```

In `menu-items.ts`, update the "Video Embed" action:

```typescript
action: (editor) => {
  editor.chain().focus().insertContent({ type: "videoBlock" }).run();
},
```

- [ ] **Step 5: Test manually**

Type `/video`, paste a YouTube URL, verify embed renders.

- [ ] **Step 6: Commit**

```bash
git add client/components/journal/editor/extensions/video-block/
git add client/components/journal/editor/useAgenticEditor.ts
git add client/components/journal/editor/slash-menu/menu-items.ts
git commit -m "feat(editor): add video embed block with YouTube, Vimeo, and Loom support"
```

---

### Task 15: Create File Attachment Block Extension

**Files:**
- Create: `client/components/journal/editor/extensions/file-block/file-block-extension.ts`
- Create: `client/components/journal/editor/extensions/file-block/FileBlockView.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p client/components/journal/editor/extensions/file-block
```

- [ ] **Step 2: Write file-block-extension.ts**

```typescript
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FileBlockView } from "./FileBlockView";

export const FileBlock = Node.create({
  name: "fileBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
      filename: { default: "" },
      mimeType: { default: "" },
      sizeBytes: { default: 0 },
      uploadedAt: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="file-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "file-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileBlockView);
  },
});
```

- [ ] **Step 3: Write FileBlockView.tsx**

```typescript
"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRef, useCallback } from "react";
import { FileText, Download, Trash2, Paperclip, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
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
        "/upload/journal",
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
```

- [ ] **Step 4: Add FileBlock to editor and wire slash menu**

In `useAgenticEditor.ts`:

```typescript
import { FileBlock } from "./extensions/file-block/file-block-extension";

// Add to extensions array:
FileBlock,
```

In `menu-items.ts`, update the "File Attachment" action:

```typescript
action: (editor) => {
  editor.chain().focus().insertContent({ type: "fileBlock" }).run();
},
```

- [ ] **Step 5: Test manually and commit**

```bash
git add client/components/journal/editor/extensions/file-block/
git add client/components/journal/editor/useAgenticEditor.ts
git add client/components/journal/editor/slash-menu/menu-items.ts
git commit -m "feat(editor): add file attachment block with upload, preview, and download"
```

---

## Phase 6: Drawing Canvas

### Task 16: Create Drawing Canvas Modal

**Files:**
- Create: `client/components/journal/editor/canvas/DrawingCanvasModal.tsx`
- Create: `client/components/journal/editor/canvas/CanvasToolbar.tsx`
- Create: `client/components/journal/editor/canvas/ColorPicker.tsx`
- Create: `client/components/journal/editor/extensions/drawing-block/drawing-block-extension.ts`
- Create: `client/components/journal/editor/extensions/drawing-block/DrawingBlockView.tsx`

This is a large task. The core approach: Fabric.js is dynamically imported only when the canvas opens. The canvas modal is a full-screen overlay. On save, it exports both a PNG preview and the Fabric.js JSON for re-editing.

- [ ] **Step 1: Create directories**

```bash
mkdir -p client/components/journal/editor/canvas
mkdir -p client/components/journal/editor/extensions/drawing-block
```

- [ ] **Step 2: Write ColorPicker.tsx**

```typescript
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const OBSERVATORY_PALETTE = [
  "#ffffff", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9",
  "#60a5fa", "#3b82f6", "#2dd4bf", "#14b8a6", "#f59e0b",
  "#ef4444", "#ec4899", "#94a3b8", "#475569", "#1e293b",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="p-2 rounded-xl bg-[#0e0a22] border border-white/10">
      <div className="grid grid-cols-5 gap-1.5 mb-2">
        {OBSERVATORY_PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={cn(
              "w-7 h-7 rounded-lg border-2 transition-all",
              value === color ? "border-white/60 scale-110" : "border-transparent hover:border-white/20"
            )}
            style={{ background: color }}
          />
        ))}
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded cursor-pointer bg-transparent"
      />
    </div>
  );
}
```

- [ ] **Step 3: Write CanvasToolbar.tsx**

```typescript
"use client";

import {
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  MousePointer,
  Hand,
  Minus,
  Triangle,
  MoveRight,
  Undo,
  Redo,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasTool =
  | "select" | "pen" | "eraser" | "hand"
  | "rect" | "circle" | "triangle" | "line" | "arrow"
  | "text";

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  strokeWidth: number;
  onStrokeWidthChange: (w: number) => void;
  strokeColor: string;
  onStrokeColorChange: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { tool: CanvasTool; icon: typeof Pencil; label: string }[] = [
  { tool: "select", icon: MousePointer, label: "Select" },
  { tool: "pen", icon: Pencil, label: "Pen" },
  { tool: "eraser", icon: Eraser, label: "Eraser" },
  { tool: "hand", icon: Hand, label: "Pan" },
  { tool: "rect", icon: Square, label: "Rectangle" },
  { tool: "circle", icon: Circle, label: "Circle" },
  { tool: "triangle", icon: Triangle, label: "Triangle" },
  { tool: "line", icon: Minus, label: "Line" },
  { tool: "arrow", icon: MoveRight, label: "Arrow" },
  { tool: "text", icon: Type, label: "Text" },
];

export function CanvasToolbar({
  activeTool,
  onToolChange,
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl">
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            title={label}
            className={cn(
              "p-2 rounded-lg transition-all",
              activeTool === tool
                ? "bg-purple-500/25 text-purple-300"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* Stroke width */}
      <input
        type="range"
        min={1}
        max={20}
        value={strokeWidth}
        onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
        className="w-20 accent-purple-500"
        title={`Stroke: ${strokeWidth}px`}
      />

      {/* Color */}
      <input
        type="color"
        value={strokeColor}
        onChange={(e) => onStrokeColorChange(e.target.value)}
        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
      />

      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* History */}
      <button onClick={onUndo} disabled={!canUndo} className={cn("p-2 rounded-lg transition-colors", canUndo ? "text-white/40 hover:text-white/70" : "text-white/10")}>
        <Undo className="w-4 h-4" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className={cn("p-2 rounded-lg transition-colors", canRedo ? "text-white/40 hover:text-white/70" : "text-white/10")}>
        <Redo className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button onClick={onClear} className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors" title="Clear canvas">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write DrawingCanvasModal.tsx**

This component lazily imports Fabric.js and manages the full canvas lifecycle.

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { CanvasToolbar, type CanvasTool } from "./CanvasToolbar";

interface DrawingCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pngDataUrl: string, fabricJson: string) => void;
  initialFabricJson?: string;
}

export function DrawingCanvasModal({
  isOpen,
  onClose,
  onSave,
  initialFabricJson,
}: DrawingCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#a78bfa");
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // Lazy load Fabric.js
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    (async () => {
      const fabricModule = await import("fabric");
      if (!mounted || !canvasRef.current) return;

      const canvas = new fabricModule.Canvas(canvasRef.current, {
        isDrawingMode: true,
        backgroundColor: "#02020a",
        width: window.innerWidth,
        height: window.innerHeight - 120,
      });

      canvas.freeDrawingBrush = new fabricModule.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;

      if (initialFabricJson) {
        await canvas.loadFromJSON(initialFabricJson);
        canvas.renderAll();
      }

      fabricCanvasRef.current = canvas;
      setFabricLoaded(true);

      // Save initial history state
      saveHistory();

      canvas.on("object:added", saveHistory);
      canvas.on("object:modified", saveHistory);
      canvas.on("object:removed", saveHistory);
    })();

    return () => {
      mounted = false;
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
      setFabricLoaded(false);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update brush settings
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (activeTool === "pen" || activeTool === "eraser") {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = activeTool === "eraser" ? "#02020a" : strokeColor;
        canvas.freeDrawingBrush.width = activeTool === "eraser" ? strokeWidth * 3 : strokeWidth;
      }
    } else {
      canvas.isDrawingMode = false;
    }

    if (activeTool === "select") {
      canvas.selection = true;
    } else {
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [activeTool, strokeWidth, strokeColor]);

  const saveHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    await canvas.loadFromJSON(historyRef.current[historyIndexRef.current]);
    canvas.renderAll();
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const handleRedo = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    await canvas.loadFromJSON(historyRef.current[historyIndexRef.current]);
    canvas.renderAll();
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const handleClear = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#02020a";
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const handleSave = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const pngDataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const fabricJson = JSON.stringify(canvas.toJSON());
    onSave(pngDataUrl, fabricJson);
  }, [onSave]);

  // Handle shape insertion on canvas click
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricLoaded) return;

    const handleMouseDown = async (opt: any) => {
      if (["rect", "circle", "triangle", "line", "arrow", "text"].includes(activeTool)) {
        const fabricModule = await import("fabric");
        const pointer = canvas.getScenePoint(opt.e);
        let obj: any;

        switch (activeTool) {
          case "rect":
            obj = new fabricModule.Rect({
              left: pointer.x, top: pointer.y, width: 120, height: 80,
              fill: "transparent", stroke: strokeColor, strokeWidth,
            });
            break;
          case "circle":
            obj = new fabricModule.Circle({
              left: pointer.x, top: pointer.y, radius: 50,
              fill: "transparent", stroke: strokeColor, strokeWidth,
            });
            break;
          case "triangle":
            obj = new fabricModule.Triangle({
              left: pointer.x, top: pointer.y, width: 100, height: 80,
              fill: "transparent", stroke: strokeColor, strokeWidth,
            });
            break;
          case "line":
            obj = new fabricModule.Line([pointer.x, pointer.y, pointer.x + 150, pointer.y], {
              stroke: strokeColor, strokeWidth,
            });
            break;
          case "arrow":
            obj = new fabricModule.Line([pointer.x, pointer.y, pointer.x + 150, pointer.y], {
              stroke: strokeColor, strokeWidth,
            });
            break;
          case "text":
            obj = new fabricModule.IText("Text", {
              left: pointer.x, top: pointer.y,
              fill: strokeColor, fontSize: 24, fontFamily: "Nunito, sans-serif",
            });
            break;
        }

        if (obj) {
          canvas.add(obj);
          canvas.setActiveObject(obj);
          setActiveTool("select");
        }
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    return () => { canvas.off("mouse:down", handleMouseDown); };
  }, [activeTool, strokeColor, strokeWidth, fabricLoaded]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = fabricCanvasRef.current;
        const active = canvas?.getActiveObject();
        if (active) {
          canvas.remove(active);
          canvas.renderAll();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleUndo, handleRedo]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-[#02020a]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0e0a22]">
            <span className="observatory-font-display text-white/40" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
              DRAWING CANVAS
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 transition-all text-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save Drawing
              </button>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <CanvasToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            canUndo={canUndo}
            canRedo={canRedo}
          />

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Write drawing-block-extension.ts**

```typescript
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DrawingBlockView } from "./DrawingBlockView";

export const DrawingBlock = Node.create({
  name: "drawingBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      previewUrl: { default: null },
      fabricJson: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="drawing-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "drawing-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingBlockView);
  },
});
```

- [ ] **Step 6: Write DrawingBlockView.tsx**

```typescript
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
```

- [ ] **Step 7: Add DrawingBlock to editor and wire slash menu**

In `useAgenticEditor.ts`:

```typescript
import { DrawingBlock } from "./extensions/drawing-block/drawing-block-extension";

// Add to extensions array:
DrawingBlock,
```

In `menu-items.ts`, update the "Drawing Canvas" action:

```typescript
action: (editor) => {
  editor.chain().focus().insertContent({ type: "drawingBlock" }).run();
},
```

- [ ] **Step 8: Test manually**

Type `/drawing` in the editor. Verify:
- Canvas modal opens full-screen
- Pen tool draws on canvas
- Shape tools (rect, circle, triangle) create shapes
- Text tool places editable text
- Undo/Redo with Ctrl+Z/Ctrl+Shift+Z
- Save creates preview in editor
- Edit re-opens canvas with previous drawing

- [ ] **Step 9: Commit**

```bash
git add client/components/journal/editor/canvas/
git add client/components/journal/editor/extensions/drawing-block/
git add client/components/journal/editor/useAgenticEditor.ts
git add client/components/journal/editor/slash-menu/menu-items.ts
git commit -m "feat(editor): add drawing canvas with Fabric.js — pen, shapes, text, undo/redo"
```

---

## Phase 7: Voice Dictation

### Task 17: Create Dictation Mode

**Files:**
- Create: `client/components/journal/editor/useDictation.ts`
- Create: `client/components/journal/editor/dictation/DictationOverlay.tsx`

- [ ] **Step 1: Create dictation directory**

```bash
mkdir -p client/components/journal/editor/dictation
```

- [ ] **Step 2: Write useDictation.ts**

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type DictationStatus = "idle" | "listening" | "paused" | "error";

interface UseDictationOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
  lang?: string;
}

interface UseDictationReturn {
  status: DictationStatus;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  elapsed: number;
  error: string | null;
  isSupported: boolean;
}

export function useDictation({
  onTranscript,
  onEnd,
  lang = "en-US",
}: UseDictationOptions): UseDictationReturn {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser");
      setStatus("error");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const isFinal = result.isFinal;

        // Voice commands
        if (isFinal) {
          const lower = text.toLowerCase().trim();
          if (lower === "new paragraph") {
            onTranscript("\n\n", true);
            continue;
          }
          if (lower === "new line") {
            onTranscript("\n", true);
            continue;
          }
          if (lower === "stop dictation") {
            stop();
            continue;
          }
        }

        onTranscript(text, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setStatus("error");
    };

    recognition.onend = () => {
      if (status === "listening") {
        // Auto-restart for continuous dictation
        try { recognition.start(); } catch { /* already started */ }
      } else {
        onEnd?.();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
    setElapsed(0);
    setError(null);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, [isSupported, lang, onTranscript, onEnd, status]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    onEnd?.();
  }, [onEnd]);

  const pause = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("paused");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resume = useCallback(() => {
    recognitionRef.current?.start();
    setStatus("listening");
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { status, start, stop, pause, resume, elapsed, error, isSupported };
}
```

- [ ] **Step 3: Write DictationOverlay.tsx**

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Square, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface DictationOverlayProps {
  isActive: boolean;
  status: "idle" | "listening" | "paused" | "error";
  elapsed: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function DictationOverlay({
  isActive,
  status,
  elapsed,
  onPause,
  onResume,
  onStop,
}: DictationOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[65] flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl shadow-2xl"
        >
          {/* Mic indicator */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            status === "listening" ? "bg-red-500/20 animate-pulse" : "bg-white/5"
          )}>
            <Mic className={cn("w-5 h-5", status === "listening" ? "text-red-400" : "text-white/30")} />
          </div>

          {/* Status */}
          <div>
            <div className="text-white/60 text-sm font-medium observatory-font-body">
              {status === "listening" ? "Listening..." : status === "paused" ? "Paused" : "Dictation"}
            </div>
            <div className="text-white/25 text-xs">{formatTime(elapsed)}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-2">
            {status === "listening" ? (
              <button
                onClick={onPause}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : status === "paused" ? (
              <button
                onClick={onResume}
                className="p-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : null}
            <button
              onClick={onStop}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Wire dictation into AgenticEditor**

In `AgenticEditor.tsx`, add:

```typescript
import { useDictation } from "./useDictation";
import { DictationOverlay } from "./dictation/DictationOverlay";

// Inside the component, add:
const [dictationActive, setDictationActive] = useState(false);

const dictation = useDictation({
  onTranscript: (text, isFinal) => {
    if (isFinal && api.editor) {
      api.editor.chain().focus().insertContent(text + " ").run();
    }
  },
  onEnd: () => setDictationActive(false),
});

// Listen for slash menu dictation event
useEffect(() => {
  const handler = () => {
    setDictationActive(true);
    dictation.start();
  };
  document.addEventListener("slash-menu:dictation", handler);
  return () => document.removeEventListener("slash-menu:dictation", handler);
}, [dictation.start]);

// Add to JSX:
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
```

- [ ] **Step 5: Test manually**

Type `/dictation`, speak into microphone. Verify:
- Dictation overlay appears at bottom
- Speech is transcribed into the editor in real-time
- Pause/Resume/Stop controls work
- "New paragraph" voice command inserts line breaks
- "Stop dictation" voice command stops dictation

- [ ] **Step 6: Commit**

```bash
git add client/components/journal/editor/useDictation.ts
git add client/components/journal/editor/dictation/
git add client/components/journal/editor/AgenticEditor.tsx
git commit -m "feat(editor): add voice dictation mode with Web Speech API and voice commands"
```

---

## Phase 8: Agentic AI System

### Task 18: Create AI Pill & Coach Panel

**Files:**
- Create: `client/components/journal/editor/ai/AIPill.tsx`
- Create: `client/components/journal/editor/ai/AICoachPanel.tsx`
- Create: `client/components/journal/editor/ai/CoachingNudge.tsx`
- Create: `client/components/journal/editor/ai/GhostText.tsx`
- Create: `client/components/journal/editor/ai/useGhostText.ts`
- Create: `client/components/journal/editor/ai/useAICoach.ts`

This is the largest phase. Due to the plan size constraints, I'll provide the core AI Pill and Coach Panel. The ghost text and AI slash commands use the same pattern (dispatch events, call API, stream response).

- [ ] **Step 1: Create ai directory**

```bash
mkdir -p client/components/journal/editor/ai
```

- [ ] **Step 2: Write useAICoach.ts**

```typescript
"use client";

import { useState, useCallback } from "react";

export interface CoachInsight {
  type: "pattern" | "connection" | "time_aware" | "encouragement";
  message: string;
  action?: string;
}

interface UseAICoachReturn {
  insights: CoachInsight[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<string>;
  analyzeContent: (text: string, mode: string) => Promise<void>;
  dismissInsight: (index: number) => void;
}

export function useAICoach(): UseAICoachReturn {
  const [insights, setInsights] = useState<CoachInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeContent = useCallback(async (text: string, mode: string) => {
    if (text.trim().length < 50) return;

    // Pattern detection (client-side for instant feedback)
    const words = text.toLowerCase();
    const newInsights: CoachInsight[] = [];

    const stressWords = ["stress", "anxious", "overwhelm", "worry", "pressure"];
    const stressCount = stressWords.reduce(
      (count, word) => count + (words.split(word).length - 1), 0
    );
    if (stressCount >= 3) {
      newInsights.push({
        type: "pattern",
        message: `You've mentioned stress-related words ${stressCount} times. Want to explore what's driving that?`,
        action: "Reframe this",
      });
    }

    // Time-aware prompts
    const hour = new Date().getHours();
    if (hour >= 21) {
      newInsights.push({
        type: "time_aware",
        message: "It's late — your evening entries tend to be more reflective. Take your time.",
      });
    } else if (hour < 8) {
      newInsights.push({
        type: "time_aware",
        message: "Early morning writing — set an intention for the day ahead.",
      });
    }

    setInsights(newInsights);
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<string> => {
    setIsLoading(true);
    try {
      // TODO: Wire to /v1/ai/coach/journal API
      // For now, return a placeholder
      await new Promise((r) => setTimeout(r, 1000));
      return "I hear you. Let's explore that thought further — what feels most important to address right now?";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissInsight = useCallback((index: number) => {
    setInsights((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { insights, isLoading, sendMessage, analyzeContent, dismissInsight };
}
```

- [ ] **Step 3: Write AIPill.tsx**

```typescript
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachInsight } from "./useAICoach";

interface AIPillProps {
  insights: CoachInsight[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<string>;
  onDismissInsight: (index: number) => void;
  onQuickAction?: (action: string) => void;
}

const INSIGHT_ICONS: Record<string, string> = {
  pattern: "🔍",
  connection: "🔗",
  time_aware: "🌙",
  encouragement: "✨",
};

export function AIPill({
  insights,
  isLoading,
  onSendMessage,
  onDismissInsight,
  onQuickAction,
}: AIPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim()) return;
    const message = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);

    const response = await onSendMessage(message);
    setChatMessages((prev) => [...prev, { role: "ai", text: response }]);
  }, [chatInput, onSendMessage]);

  return (
    <div className="fixed bottom-20 right-6 z-[65]">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 rounded-2xl border border-white/10 bg-[#0e0a22]/98 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="observatory-font-display text-white/60" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
                  AI COACH
                </span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="px-3 py-2 space-y-2 max-h-40 overflow-y-auto observatory-scroll border-b border-white/5">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 px-2 py-2 rounded-lg bg-white/[0.02]">
                    <span className="text-sm">{INSIGHT_ICONS[insight.type] || "💡"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/50 text-xs leading-relaxed">{insight.message}</p>
                      {insight.action && (
                        <button
                          onClick={() => onQuickAction?.(insight.action!)}
                          className="mt-1 text-purple-400/70 text-xs hover:text-purple-300 transition-colors"
                        >
                          {insight.action} →
                        </button>
                      )}
                    </div>
                    <button onClick={() => onDismissInsight(i)} className="text-white/10 hover:text-white/30 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <div className="px-3 py-2 space-y-2 max-h-48 overflow-y-auto observatory-scroll">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("text-xs leading-relaxed px-2 py-1.5 rounded-lg", msg.role === "user" ? "bg-purple-500/10 text-purple-200 ml-6" : "bg-white/[0.02] text-white/50 mr-6")}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            {/* Chat input */}
            <div className="px-3 py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Ask AI anything..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white/60 placeholder:text-white/15 text-xs focus:outline-none focus:border-purple-500/20"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !chatInput.trim()}
                  className="p-2 rounded-lg text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-30"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {["Reframe this", "Suggest prompt", "Go deeper"].map((action) => (
                  <button
                    key={action}
                    onClick={() => onQuickAction?.(action)}
                    className="px-2.5 py-1 rounded-full bg-white/5 text-white/25 hover:text-white/50 hover:bg-white/10 transition-colors text-xs"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-purple-500/20 bg-[#0e0a22]/90 backdrop-blur-xl text-purple-300/70 hover:text-purple-200 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="observatory-font-display" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
              AI
            </span>
            {insights.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-200 flex items-center justify-center" style={{ fontSize: 9 }}>
                {insights.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Write CoachingNudge.tsx**

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CoachingNudgeProps {
  message: string | null;
  onDismiss: () => void;
}

export function CoachingNudge({ message, onDismiss }: CoachingNudgeProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, x: 20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed top-20 right-6 z-[65] max-w-xs rounded-xl border border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl px-4 py-3 shadow-xl"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400/60 mt-0.5 flex-shrink-0" />
            <p className="text-white/50 text-xs leading-relaxed flex-1">{message}</p>
            <button onClick={onDismiss} className="text-white/15 hover:text-white/40 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Wire AI components into AgenticEditor**

In `AgenticEditor.tsx`, add:

```typescript
import { useAICoach } from "./ai/useAICoach";
import { AIPill } from "./ai/AIPill";
import { CoachingNudge } from "./ai/CoachingNudge";

// Inside the component:
const aiCoach = useAICoach();
const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

// Analyze content periodically (debounced)
useEffect(() => {
  if (!api.editor) return;
  const timer = setTimeout(() => {
    aiCoach.analyzeContent(api.getText(), mode);
  }, 5000);
  return () => clearTimeout(timer);
}, [api.editor?.state.doc.content.size]);

// Add to JSX:
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
```

- [ ] **Step 6: Add Ctrl+J keyboard shortcut for AI pill**

In `DistractionFreeEditor.tsx`, in the global keydown handler, add:

```typescript
if ((e.metaKey || e.ctrlKey) && e.key === "j") {
  e.preventDefault();
  document.dispatchEvent(new CustomEvent("toggle-ai-pill"));
}
```

In `AIPill.tsx`, listen for this event:

```typescript
useEffect(() => {
  const handler = () => setIsExpanded((prev) => !prev);
  document.addEventListener("toggle-ai-pill", handler);
  return () => document.removeEventListener("toggle-ai-pill", handler);
}, []);
```

- [ ] **Step 7: Test manually**

Verify:
- AI pill appears bottom-right with "✦ AI" label
- Clicking expands the coaching panel
- Ctrl+J toggles the panel
- Chat input works (returns placeholder response for now)
- Quick action buttons are visible
- After writing 50+ words with stress-related content, insights appear
- Coaching nudge toasts appear top-right and auto-dismiss

- [ ] **Step 8: Commit**

```bash
git add client/components/journal/editor/ai/
git add client/components/journal/editor/AgenticEditor.tsx
git add client/components/journal/DistractionFreeEditor.tsx
git commit -m "feat(editor): add AI pill, coach panel, coaching nudges, and content analysis"
```

---

## Phase 9: Final Integration & Polish

### Task 19: Create Index Export & Final Wiring

**Files:**
- Modify: `client/components/journal/index.ts`

- [ ] **Step 1: Update journal index exports**

Add to `client/components/journal/index.ts`:

```typescript
export { AgenticEditor } from "./editor/AgenticEditor";
export { useAgenticEditor } from "./editor/useAgenticEditor";
export type { AgenticEditorAPI } from "./editor/useAgenticEditor";
```

- [ ] **Step 2: Verify full build**

```bash
cd client && npx tsc --noEmit
```

Fix any type errors that arise.

- [ ] **Step 3: Run dev server and full manual test**

```bash
cd client && npm run dev
```

Test the complete flow:
1. Open journal, select any mode → editor loads with Observatory theme
2. Type text → floating toolbar appears on selection
3. Type `/` → slash menu appears with all categories
4. `/heading1` → creates heading
5. `/image` → upload dialog opens
6. `/audio` → recording starts inline
7. `/drawing` → canvas modal opens, draw, save → preview in editor
8. `/video` → paste YouTube URL → embed appears
9. `/file` → attach a PDF → card appears
10. `/dictation` → voice-to-text streams into editor
11. `/ai continue` → dispatches AI event (placeholder for now)
12. AI pill → expands panel, chat works, insights appear
13. Ctrl+J → toggles AI panel
14. Status bar shows words, chars, completeness %
15. Ctrl+Enter → validation review modal
16. Save → entry saved successfully

- [ ] **Step 4: Commit**

```bash
git add client/components/journal/index.ts
git commit -m "feat(editor): finalize agentic journal editor integration"
```

---

### Task 20: Production Build Verification

- [ ] **Step 1: Run production build**

```bash
cd client && npm run build
```

- [ ] **Step 2: Fix any build errors**

Address any issues (unused imports, type mismatches, missing modules).

- [ ] **Step 3: Verify Fabric.js lazy loading**

Check the build output for dynamic import chunks. Fabric.js should appear as a separate chunk, not in the main bundle.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve production build issues for agentic editor"
```
