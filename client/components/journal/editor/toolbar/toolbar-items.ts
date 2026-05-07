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
          action: () => {
            document.dispatchEvent(new CustomEvent("editor:open-link-input"));
          },
          isActive: (e) => e.isActive("link"),
          shortcut: "Ctrl+K",
        },
      ],
    },
  ];
}
