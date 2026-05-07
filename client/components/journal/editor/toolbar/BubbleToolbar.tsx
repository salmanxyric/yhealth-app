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
