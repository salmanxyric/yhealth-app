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
