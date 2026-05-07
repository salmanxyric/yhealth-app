import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { SlashMenuList, type SlashMenuListRef } from "./SlashMenuList";
import {
  getSlashMenuItems,
  filterSlashMenuItems,
  type SlashMenuItem,
} from "./menu-items";

export const SlashMenuExtension = Extension.create({
  name: "slashMenu",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Parameters<typeof Extension.create>[0] extends undefined
            ? never
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              any;
          range: Parameters<
            NonNullable<SuggestionOptions["command"]>
          >[0]["range"];
          props: SlashMenuItem;
        }) => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate(props: any) {
              component?.updateProps(props);
              if (props.clientRect && popup?.[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
