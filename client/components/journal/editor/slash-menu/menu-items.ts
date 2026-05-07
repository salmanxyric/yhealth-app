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
      action: (editor) => {
        editor.chain().focus().insertContent({
          type: "audioBlock",
          attrs: { isRecording: true },
        }).run();
      },
    },
    {
      title: "Drawing Canvas",
      description: "Open the drawing tool",
      icon: "pencil-ruler",
      category: "media",
      action: (editor) => {
        editor.chain().focus().insertContent({ type: "drawingBlock" }).run();
      },
    },
    {
      title: "Video Embed",
      description: "Embed a YouTube or Vimeo video",
      icon: "video",
      category: "media",
      action: (editor) => {
        editor.chain().focus().insertContent({ type: "videoBlock" }).run();
      },
    },
    {
      title: "File Attachment",
      description: "Attach a document",
      icon: "paperclip",
      category: "media",
      action: (editor) => {
        editor.chain().focus().insertContent({ type: "fileBlock" }).run();
      },
    },
    {
      title: "Horizontal Rule",
      description: "Visual separator",
      icon: "minus",
      category: "divider",
      action: (e) => e.chain().focus().setHorizontalRule().run(),
    },
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

export function filterSlashMenuItems(
  items: SlashMenuItem[],
  query: string
): SlashMenuItem[] {
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );
}
