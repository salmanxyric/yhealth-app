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
