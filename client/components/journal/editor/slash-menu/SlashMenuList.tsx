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
