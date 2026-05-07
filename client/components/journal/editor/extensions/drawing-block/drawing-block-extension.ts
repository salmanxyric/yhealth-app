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
