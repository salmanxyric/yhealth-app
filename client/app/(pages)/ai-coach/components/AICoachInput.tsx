"use client";

import { Link2, Camera, ArrowUp, Loader2 } from "lucide-react";
import Image from "next/image";

interface AICoachInputProps {
  inputMessage: string;
  isSending: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAttach: () => void;
  onCamera: () => void;
}

export function AICoachInput({
  inputMessage,
  isSending,
  inputRef,
  onInputChange,
  onSend,
  onKeyDown,
  onAttach,
  onCamera,
}: AICoachInputProps) {
  return (
    <div className="w-full px-2 sm:px-4 pb-2 sm:pb-3">
      <div className="bg-[#02091b] border-[1.5px] border-white/[0.17] rounded-[24px] p-4 sm:p-5 flex flex-col gap-4">
        {/* Top row: Star icon + Textarea */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/chatai/StarFour.svg" alt="" fill className="object-contain" />
          </div>
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Anything..."
            rows={1}
            className="flex-1 text-white text-[20px] font-normal placeholder-[#9f9f9f] focus:outline-none resize-none leading-normal"
          />
        </div>

        {/* Bottom row: Actions + Send */}
        <div className="flex items-center justify-between w-full">
          {/* Left actions */}
          <div className="flex items-end gap-3">
            <button
              onClick={onAttach}
              className="flex items-center gap-3 pr-4 py-1 border-r border-white/20"
            >
              <Link2 className="w-5 h-5 text-white/70" />
              <span className="text-[16px] text-white font-normal">Attach</span>
            </button>
            <button
              onClick={onCamera}
              className="flex items-center gap-3 pr-4"
            >
              <Camera className="w-5 h-5 text-white/70" />
              <span className="text-[16px] text-white font-normal">Camera</span>
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={!inputMessage.trim() || isSending}
            className="flex items-center justify-center w-[47px] h-[47px] bg-[#0099b9] rounded-[8px] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <ArrowUp className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
