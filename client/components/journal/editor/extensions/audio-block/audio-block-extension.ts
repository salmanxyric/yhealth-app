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
